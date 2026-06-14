import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type Stream from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  type AnyMessageContent,
  downloadMediaMessage,
  type proto,
  type WAMessage,
} from '@whiskeysockets/baileys';
import type { Logger } from 'pino';
import type { Client } from '../../../core/client/client.js';
import type { ClientMediaUpload, ContextOptions, SerializedMessage } from '../../../types/index.js';
import {
  getStreamWithFileTypeFromStream,
  parsePhoneNumber,
  resolveMedia,
} from '../../../utils/index.js';
import { GroupContext } from './group.context.js';
import { UserContext } from './user.context.js';

export class Context {
  public readonly client: Client;
  public readonly msg: SerializedMessage;
  public readonly logger: Logger;

  public readonly user: UserContext;
  public readonly group: GroupContext | null;
  constructor(opt: ContextOptions) {
    this.msg = opt.msg;
    this.user = new UserContext(opt.user);
    this.group = opt.group ? new GroupContext(opt.group) : null;
    this.client = opt.client;
    this.logger = opt.logger;
  }

  get botPn() {
    return this.client.sock.user?.id ?? '';
  }
  get botLid() {
    return this.client.sock.user?.lid ?? '';
  }

  public async reply(text: string) {
    return this.client.sock.sendMessage(this.msg.from, { text }, { quoted: this.msg });
  }
  public async downloadMediaMessageBuffer(msg: SerializedMessage = this.msg): Promise<Buffer> {
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: this.logger,
        reuploadRequest: this.client.sock.updateMediaMessage,
      },
    );
    return buffer;
  }
  public async downloadMediaMessageStream(
    msg: SerializedMessage = this.msg,
  ): Promise<Stream.Transform> {
    const stream = await downloadMediaMessage(
      msg,
      'stream',
      {},
      {
        logger: this.logger,
        reuploadRequest: this.client.sock.updateMediaMessage,
      },
    );
    return stream;
  }

  public async downloadAndSaveMediaMessage(
    msg: SerializedMessage = this.msg,
    folder: string = tmpdir(),
    attachExtension: boolean = true,
  ): Promise<string> {
    await mkdir(folder, { recursive: true });

    const basePath = join(folder, `${msg.sender.split('@')[0]}_${Date.now()}`);

    const mediaStream = await this.downloadMediaMessageStream(msg);

    const streamWithFileType = await getStreamWithFileTypeFromStream(mediaStream);
    if (!streamWithFileType) throw new Error('Failed to get file type');

    const filePath = attachExtension ? `${basePath}.${streamWithFileType?.ext ?? 'bin'}` : basePath;

    const writeStream = createWriteStream(filePath);

    try {
      await pipeline(streamWithFileType.stream, writeStream);
    } catch (err) {
      await unlink(filePath).catch(() => {});
      throw err;
    }

    return filePath;
  }

  public async sendText(
    jid: string,
    text: string,
    quoted: SerializedMessage = this.msg,
    options?: Partial<AnyMessageContent>,
  ): Promise<WAMessage | undefined> {
    return this.client.sock.sendMessage(jid, { text, ...options }, { quoted });
  }

  public async sendImage(
    jid: string,
    image: ClientMediaUpload,
    caption?: string,
    quoted: SerializedMessage = this.msg,
    options?: Partial<AnyMessageContent>,
  ): Promise<WAMessage | undefined> {
    return this.client.sock.sendMessage(
      jid,
      {
        image: resolveMedia(image),
        caption,
        ...options,
      },
      { quoted },
    );
  }

  public async sendVideo(
    jid: string,
    video: ClientMediaUpload,
    caption?: string,
    quoted: SerializedMessage = this.msg,
    gifPlayback: boolean = false,
    options?: Partial<AnyMessageContent>,
  ): Promise<WAMessage | undefined> {
    return this.client.sock.sendMessage(
      jid,
      { video: resolveMedia(video), caption, gifPlayback, ...options },
      { quoted },
    );
  }
  public async sendAudio(
    jid: string,
    audio: ClientMediaUpload,
    mimetype = 'audio/mp4',
    ptt?: boolean,
    quoted: SerializedMessage = this.msg,
    options?: Partial<AnyMessageContent>,
  ): Promise<WAMessage | undefined> {
    return this.client.sock.sendMessage(
      jid,
      { audio: resolveMedia(audio), ptt, mimetype, ...options },
      { quoted },
    );
  }

  public async sendReaction(
    jid: string,
    emoji: string,
    key: proto.IMessageKey,
  ): Promise<WAMessage | undefined> {
    return this.client.sock.sendMessage(jid, {
      react: { text: emoji, key },
    });
  }

  public async sendContact(
    jid: string,
    contacts: string[],
    msg: SerializedMessage = this.msg,
    options?: Partial<AnyMessageContent>,
  ): Promise<WAMessage | undefined> {
    const listContact = await Promise.all(
      contacts.map(async (c) => {
        const international = parsePhoneNumber(c);
        return {
          displayName: msg?.pushName ?? international,
          vcard: [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${msg?.pushName ?? international}`,
            `FN:${msg?.pushName ?? international}`,
            `item1.TEL;waid=${international}:${international}`,
            'item1.X-ABLabel:Mobile',
            'END:VCARD',
          ].join('\n'),
        };
      }),
    );

    return this.client.sock.sendMessage(
      jid,
      {
        contacts: {
          displayName: `${listContact.length} Kontak`,
          contacts: listContact,
        },
        ...options,
      },
      { quoted: msg?.quoted },
    );
  }
}
