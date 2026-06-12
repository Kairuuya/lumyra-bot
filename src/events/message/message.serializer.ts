import type { proto, WAMessage } from '@whiskeysockets/baileys';
import { BotConfig } from '../../config/index.js';
import type { Client } from '../../core/client/client.js';
import type { Logger } from '../../core/logger/pino.js';
import type { SerializedMessage } from '../../types/index.js';
import {
  areJidsSameUser,
  getContextInfo,
  getMessageText,
  getNormalizedMessage,
  isJidGroup,
  isJidStatusBroadcast,
  normalizeJid,
} from '../../utils/index.js';

export class MessageSerializer {
  constructor(
    private readonly client: Client,
    private readonly logger: Logger,
  ) {}

  public serialize(rawMessage: WAMessage): SerializedMessage | undefined {
    if (!rawMessage?.message) {
      this.logger.warn({ rawMessage }, 'Serialize: rawMessage.message is missing');
      return;
    }

    const resolved = getNormalizedMessage(rawMessage.message);
    if (!resolved) {
      this.logger.warn({ message: rawMessage.message }, 'Serialize: resolveMessage is missing');
      return;
    }

    const { message, type } = resolved;

    const botJid = this.client.user?.id;
    const botLid = this.client.user?.lid;

    const isGroup = isJidGroup(rawMessage?.key?.remoteJid) || false;
    const isStatus = rawMessage.key.remoteJid === 'status@broadcast' || false;
    const fromMe =
      areJidsSameUser(rawMessage.key?.remoteJid, botJid) || rawMessage.key.fromMe || false;

    const from =
      isGroup || isJidStatusBroadcast(rawMessage?.key?.remoteJid)
        ? rawMessage.key.remoteJid || ''
        : rawMessage.key.remoteJidAlt || '';

    const sender = isGroup
      ? fromMe
        ? rawMessage.key.remoteJidAlt || botJid
        : rawMessage.key.participantAlt || ''
      : fromMe
        ? botJid || rawMessage.key.remoteJidAlt || ''
        : rawMessage.key.remoteJidAlt || rawMessage.key.remoteJid || '';

    const lid = isGroup
      ? rawMessage.key.participant || ''
      : fromMe
        ? botLid || ''
        : isStatus
          ? rawMessage.key.participant || ''
          : rawMessage.key.remoteJid || '';

    const contextInfo = getContextInfo(message, type);
    const expiration = contextInfo?.expiration ?? 0;
    const mentions = contextInfo?.mentionedJid ?? [];
    const bodyFields = this.getBodyFields(message, type);
    const isOwner = BotConfig.ownerNumber.includes(sender.split('@')[0]);

    const m: SerializedMessage = {
      key: rawMessage.key,
      id: rawMessage.key.id ?? '',
      isGroup,
      isOwner,
      from,
      fromMe,
      sender,
      lid,
      message,
      type,
      expiration,
      messageTimestamp: Number(rawMessage.messageTimestamp) || Date.now(),
      pushName: rawMessage.pushName ?? '',
      mentions,
      ...bodyFields,
      quoted: undefined,
    };

    m.quoted = this.buildQuoted(m.from, m.sender, contextInfo);

    return m;
  }
  private getBodyFields(message: proto.IMessage, _type: keyof proto.IMessage) {
    const body = getMessageText(message)?.trim() || '';
    const prefixes = BotConfig.prefix || ['!', '.', '/'];
    const prefix = prefixes.find((p) => body.startsWith(p)) || '';
    const args = body.slice(prefix?.length).trim().split(/ +/) || [];
    const command = prefix ? args[0] : '';
    const query = prefix ? args.slice(1).join(' ') : '';

    return { body, args, prefix, command, query };
  }

  private buildQuoted(
    parentFrom: string,
    parentSender: string,
    contextInfo?: proto.IContextInfo,
  ): SerializedMessage | undefined {
    if (!contextInfo?.quotedMessage) return;

    const quotedResolved = getNormalizedMessage(contextInfo.quotedMessage);
    if (!quotedResolved) return;

    const { message: finalQuotedMessage, type: quotedType } = quotedResolved;

    const stanzaId = contextInfo.stanzaId ?? '';
    const participant = contextInfo.participant ?? '';

    const botJid = normalizeJid(this.client.user?.id);
    const botLid = normalizeJid(this.client.user?.lid);
    const isFromMe = areJidsSameUser(participant, participant.endsWith('@lid') ? botLid : botJid);

    const remoteJid = parentFrom || parentSender; // on same chat
    const isGroup = remoteJid.endsWith('@g.us');
    const senderJid = isFromMe ? normalizeJid(botJid) : normalizeJid(participant);

    const senderLid = isFromMe ? botLid : normalizeJid(participant);

    const bodyFields = this.getBodyFields(finalQuotedMessage, quotedType);
    const subContextInfo = getContextInfo(finalQuotedMessage, quotedType);
    const _expiration = subContextInfo?.expiration ?? 0;
    const mentions = subContextInfo?.mentionedJid ?? [];

    const q: SerializedMessage = {
      key: {
        remoteJid: remoteJid,
        fromMe: isFromMe,
        id: stanzaId,
        participant: senderLid,
        participantAlt: senderJid,
      },
      id: stanzaId,
      from: remoteJid,
      fromMe: isFromMe,
      isGroup: isGroup,
      type: quotedType,
      message: finalQuotedMessage,
      sender: senderJid,
      lid: senderLid,
      expiration: 0,
      messageTimestamp: Date.now(),
      pushName: '',
      mentions,
      isOwner: BotConfig.ownerNumber.includes(senderJid.split('@')[0]),
      ...bodyFields,
    };

    return q;
  }
}
