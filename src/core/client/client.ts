import { Boom } from '@hapi/boom';
import type { PrismaClient } from '@prisma/client';
import {
  Browsers,
  type ConnectionState,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  type MessageRelayOptions,
  makeCacheableSignalKeyStore,
  makeWASocket,
  type proto,
  type UserFacingSocketConfig,
  type WASocket,
} from '@whiskeysockets/baileys';
import { EventEmitter } from 'eventemitter3';
import qrcode from 'qrcode-terminal';
import type { IBotConfig } from '../../config/bot.config.js';
import type { Logger } from '../logger/pino.js';
import { usePrismaAuthState } from './auth.js';
import { REASON_MAP } from './constants.js';
import type { ClientEventMap } from './events.js';

export class Client extends EventEmitter<ClientEventMap> {
  private readonly config: IBotConfig;
  private readonly socketConfig: Partial<UserFacingSocketConfig>;
  private _socket: WASocket | null;
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;
  private tryConnect = 0;
  private isConnecting = false;

  constructor(options: {
    socketConfig: Partial<UserFacingSocketConfig>;
    config: IBotConfig;
    prisma: PrismaClient;
    logger: Logger;
  }) {
    super();
    this.config = options.config;
    this.socketConfig = options.socketConfig;
    this._socket = null;
    this.prisma = options.prisma;
    this.logger = options.logger;
  }

  public get sock() {
    if (!this._socket) {
      throw new Error('Socket is not initialized. Call connect() first.');
    }
    return this._socket;
  }
  public get user() {
    return {
      id: this.normalizeJid(this._socket?.user?.id),
      lid: this.normalizeJid(this._socket?.user?.lid),
    };
  }

  public async clearSession(_keepCreds?: boolean): Promise<void> {
    // This will be overridden in connect()
    this.logger.warn('clearSession called before initialization.');
  }

  public async connect(): Promise<void> {
    if (this.isConnecting) {
      this.logger.debug('Connection attempt already in progress, skipping');
      return;
    }
    this.isConnecting = true;

    try {
      if (this._socket) {
        this._socket.ev.removeAllListeners('connection.update');
        this._socket.ev.removeAllListeners('creds.update');
        await this._socket.ws?.close();
        this._socket = null;
      }
      const { version, isLatest } = await fetchLatestBaileysVersion();
      const { state, saveCreds, clearSession } = await usePrismaAuthState(
        this.prisma,
        this.config.botNumber,
      );

      this.clearSession = clearSession;
      this._socket = makeWASocket({
        ...this.socketConfig,
        version,
        logger: this.logger.child({ scope: 'baileys' }, { level: 'silent' }),
        browser: this.socketConfig.browser || Browsers.ubuntu('Chrome'),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            this.logger.child({ scope: 'baileys-keys' }, { level: 'silent' }),
          ),
        },
      });
      this._socket.ev.on('creds.update', saveCreds);
      this.registerConnectionEvents({
        version,
        isLatest,
        clearSession,
      });
      this.patchRelayMessage();
      this.bridgeBaileysEvents();
    } catch (err) {
      this.logger.error({ err }, 'Failed to initialize WASocket client');
      this.isConnecting = false;
      throw err;
    }
  }

  private registerConnectionEvents(meta: {
    version: (string | number)[];
    isLatest: boolean;
    clearSession: () => Promise<void>;
  }): void {
    this._socket?.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { lastDisconnect, connection, qr } = update;

      // Always attempt pairing code when credentials are not yet registered and enabled in config.
      if (!this._socket?.authState?.creds?.registered) {
        // handle qr code
        if (qr && !this.config.settings.usePairingCode) {
          this.logger.info('Scan the QR code to connect:');
          qrcode.generate(qr, { small: true });
        }
        // handle pairing code
        if (this.config.settings.usePairingCode) {
          await this.requestPairingCodeSafe();
        }
      }

      if (connection === 'connecting') {
        this.logger.info('Connecting to WhatsApp...');
        return;
      }

      if (connection === 'open') {
        this.isConnecting = false;
        await this.onConnected(meta);
        return;
      }

      if (connection === 'close') {
        this.isConnecting = false;
        await this.onDisconnected(lastDisconnect?.error, meta.clearSession);
      }
    });
  }

  private async requestPairingCodeSafe(): Promise<void> {
    const phoneNumber = this.config.botNumber.replace(/\D/g, '');
    const pairingCode = this.config.customPairingCode;
    if (!phoneNumber) {
      this.logger.error('Invalid botNumber: cannot request pairing code.');
      return;
    }
    if (!this._socket?.ws?.isOpen) return;

    this.logger.info(`Requesting pairing code for ${phoneNumber}…`);
    try {
      const code = await this._socket.requestPairingCode(phoneNumber, pairingCode);
      this.logger.info(`Pairing code: ${code?.match(/.{1,4}/g)?.join('-') ?? 'N/A'}`);
    } catch (err) {
      this.logger.error({ err }, 'Failed to request pairing code.');
    }
  }

  private async onConnected(meta: {
    version: (string | number)[];
    isLatest: boolean;
  }): Promise<void> {
    this.tryConnect = 0;

    this.emit('client.ready', {
      name: this.config.botName,
      number: this.config.botNumber,
      waVersion: meta.version.join('.'),
      isLatest: meta.isLatest,
    });
  }

  private async onDisconnected(
    error: Error | Boom | undefined,
    clearSession: () => Promise<void>,
  ): Promise<void> {
    const statusCode = new Boom(error).output.statusCode;
    const config = REASON_MAP[statusCode] || {
      label: `Unknown (${statusCode})`,
      action: 'retry',
      delay: 3000,
      limit: 2,
    };
    const { label, action, delay: reconnectDelay = 3000, limit = 2 } = config;

    switch (action) {
      case 'stop':
        this.logger.warn({ err: error }, `[${statusCode}] ${label}. Stopping reconnection.`);
        this.isConnecting = false;
        this.emit('client.stopped', { reason: label, statusCode });
        break;

      case 'clear':
        this.logger.error(
          { err: error },
          `[${statusCode}] ${label}. Clearing session and stopping.`,
        );
        this.isConnecting = false;
        this.emit('client.stopped', { reason: label, statusCode });
        await clearSession();
        process.exit(1);
        break;

      case 'reconnect':
      case 'retry': {
        if (action === 'retry') {
          if (this.tryConnect >= limit) {
            this.logger.error(
              { err: error },
              `[${statusCode}] ${label}. limit retry ${this.tryConnect}/${limit}, Clear session!`,
            );
            this.isConnecting = false;
            await clearSession();
            return;
          }
          this.tryConnect++;
        } else {
          this.tryConnect = 0;
        }

        this.isConnecting = true;

        const multiplier = action === 'retry' ? this.tryConnect : 1;
        const actualDelay = reconnectDelay * multiplier;
        this.logger.info(`[${statusCode}] ${label}. Reconnecting in ${actualDelay}ms...`);
        this.emit('client.reconnecting', {
          attempt: this.tryConnect,
          reason: label,
          delayMs: actualDelay,
        });
        setTimeout(() => {
          this.isConnecting = false;
          this.connect().catch((err) => this.logger.error({ err }, 'Reconnect failed!'));
        }, actualDelay);
        break;
      }
    }
  }
  /**
   * Bridges all non-infrastructure Baileys events to the Client's own EventEmitter.
   * Called once per connect/reconnect cycle after socket creation.
   */
  private bridgeBaileysEvents(): void {
    if (!this._socket) return;
    const ev = this._socket.ev;

    this.registerMessageEvents(ev);
    this.registerChatEvents(ev);
    this.registerGroupEvents(ev);
    this.registerContactEvents(ev);
    this.registerNewsletterEvents(ev);
    this.registerMiscEvents(ev);
  }

  private registerMessageEvents(ev: WASocket['ev']): void {
    ev.on('messages.upsert', ({ messages }) => {
      for (const message of messages) {
        this.emit('messages.upsert', message);
      }
    });

    ev.on('messages.delete', (data) => {
      if ('keys' in data) {
        for (const key of data.keys) {
          this.emit('messages.delete', { key });
        }
      } else {
        this.emit('messages.delete', data);
      }
    });

    ev.on('messages.update', (updates) => {
      for (const update of updates) {
        this.emit('messages.update', update);
      }
    });

    ev.on('messages.reaction', (reactions) => {
      for (const reaction of reactions) {
        this.emit('messages.reaction', reaction);
      }
    });

    ev.on('messages.media-update', (mediaUpdates) => {
      for (const mediaUpdate of mediaUpdates) {
        this.emit('messages.media-update', mediaUpdate);
      }
    });

    ev.on('message-receipt.update', (receipts) => {
      for (const receipt of receipts) {
        this.emit('message-receipt.update', receipt);
      }
    });

    ev.on('message-capping.update', (data) => {
      this.emit('message-capping.update', data);
    });
  }

  private registerChatEvents(ev: WASocket['ev']): void {
    ev.on('chats.upsert', (chats) => {
      for (const chat of chats) {
        this.emit('chats.upsert', chat);
      }
    });

    ev.on('chats.update', (updates) => {
      for (const update of updates) {
        this.emit('chats.update', update);
      }
    });

    ev.on('chats.delete', (ids) => {
      for (const id of ids) {
        this.emit('chats.delete', id);
      }
    });

    ev.on('chats.lock', (data) => {
      this.emit('chats.lock', data);
    });
  }

  private registerGroupEvents(ev: WASocket['ev']): void {
    ev.on('groups.upsert', (groups) => {
      for (const group of groups) {
        this.emit('groups.upsert', group);
      }
    });

    ev.on('groups.update', (updates) => {
      for (const update of updates) {
        this.emit('groups.update', update);
      }
    });

    ev.on('group-participants.update', (data) => {
      this.emit('group-participants.update', data);
    });

    ev.on('group.join-request', (data) => {
      this.emit('group.join-request', data);
    });

    ev.on('group.member-tag.update', (data) => {
      this.emit('group.member-tag.update', data);
    });
  }

  private registerContactEvents(ev: WASocket['ev']): void {
    ev.on('contacts.upsert', (contacts) => {
      for (const contact of contacts) {
        this.emit('contacts.upsert', contact);
      }
    });

    ev.on('contacts.update', (updates) => {
      for (const update of updates) {
        this.emit('contacts.update', update);
      }
    });

    ev.on('presence.update', (data) => {
      this.emit('presence.update', data);
    });
  }

  private registerNewsletterEvents(ev: WASocket['ev']): void {
    ev.on('newsletter.reaction', (data) => {
      this.emit('newsletter.reaction', data);
    });

    ev.on('newsletter.view', (data) => {
      this.emit('newsletter.view', data);
    });

    ev.on('newsletter-participants.update', (data) => {
      this.emit('newsletter-participants.update', data);
    });

    ev.on('newsletter-settings.update', (data) => {
      this.emit('newsletter-settings.update', data);
    });
  }

  private registerMiscEvents(ev: WASocket['ev']): void {
    ev.on('messaging-history.set', (data) => {
      this.emit('messaging-history.set', data);
    });

    ev.on('messaging-history.status', (data) => {
      this.emit('messaging-history.status', data);
    });

    ev.on('blocklist.set', (data) => {
      this.emit('blocklist.set', data);
    });

    ev.on('blocklist.update', (data) => {
      this.emit('blocklist.update', data);
    });

    ev.on('labels.edit', (data) => {
      this.emit('labels.edit', data);
    });

    ev.on('labels.association', (data) => {
      this.emit('labels.association', data);
    });

    ev.on('lid-mapping.update', (data) => {
      this.emit('lid-mapping.update', data);
    });

    ev.on('settings.update', (data) => {
      this.emit('settings.update', data);
    });

    ev.on('call', (calls) => {
      for (const call of calls) {
        this.emit('call', call);
      }
    });
  }

  /**
   * Wraps `relayMessage` to inject the native-flow `additionalNodes` required
   * for interactive messages to render correctly on modern WA clients.
   */
  private patchRelayMessage(): void {
    if (!this._socket?.relayMessage) {
      throw new Error('relayMessage is not available.');
    }

    const original = this._socket.relayMessage.bind(this._socket);

    this._socket.relayMessage = async (
      jid: string,
      message: proto.IMessage,
      opts: MessageRelayOptions,
    ) => {
      const hasInteractive = message.viewOnceMessage?.message?.interactiveMessage != null;

      if (hasInteractive && !opts?.additionalNodes) {
        opts = {
          ...opts,
          additionalNodes: [
            {
              tag: 'biz',
              attrs: {},
              content: [
                {
                  tag: 'interactive',
                  attrs: { type: 'native_flow', v: '1' },
                  content: [
                    {
                      tag: 'native_flow',
                      attrs: { v: '9', name: 'mixed' },
                    },
                  ],
                },
              ],
            },
          ],
        };
      }

      return original(jid, message, opts);
    };
  }
  public async getLIDForPN(pn: string): Promise<string | null> {
    if (!this._socket) throw new Error('Socket not initialized');
    return this._socket.signalRepository.lidMapping.getLIDForPN(pn);
  }
  public async getPNForLID(lid: string): Promise<string | null> {
    if (!this._socket) throw new Error('Socket not initialized');
    return this._socket.signalRepository.lidMapping.getPNForLID(lid);
  }
  public normalizeJid(jid: string | null | undefined): string {
    if (!jid) return '';
    return jidNormalizedUser(jid);
  }
}
