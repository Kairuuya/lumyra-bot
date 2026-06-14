import {
  extractMessageContent,
  getContentType,
  jidNormalizedUser,
  normalizeMessageContent,
  type proto,
} from '@whiskeysockets/baileys';
export const isJidGroup = (jid?: string | null) => !!jid?.endsWith('@g.us');
export const isPnUser = (jid?: string | null) => !!jid?.endsWith('@s.whatsapp.net');
export const isLidUser = (jid?: string | null) => !!jid?.endsWith('@lid');
export const isJidStatusBroadcast = (jid?: string | null) => !!jid?.endsWith('status@broadcast');
export const areJidsSameUser = (jid1?: string | null, jid2?: string | null) =>
  Boolean(jid1 === jid2);

export const normalizeJid = (jid?: string) => {
  if (!jid) return '';
  const normalizedJid = jidNormalizedUser(jid);
  return normalizedJid;
};
export const normalizeLidOrPn = (jid?: string) => normalizeJid(jid);
type NormalizedMessage = {
  message: proto.IMessage;
  type: keyof proto.IMessage;
};
export const getNormalizedMessage = (rawMessage?: proto.IMessage | null) => {
  const message = extractMessageContent(normalizeMessageContent(rawMessage));
  if (!message) return;
  const type = message ? getContentType(message) : undefined;
  if (!type) return;
  return { message, type };
};

type TextExtractor = (msg: proto.IMessage) => string | null | undefined;

const TEXT_MAP: Partial<Record<keyof proto.IMessage, TextExtractor>> = {
  conversation: (msg) => msg.conversation,
  extendedTextMessage: (msg) =>
    msg.extendedTextMessage?.text ||
    msg.extendedTextMessage?.description ||
    msg.extendedTextMessage?.title,
  imageMessage: (msg) => msg.imageMessage?.caption,
  videoMessage: (msg) => msg.videoMessage?.caption,
  documentMessage: (msg) =>
    msg.documentMessage?.caption || msg.documentMessage?.title || msg.documentMessage?.fileName,
  ptvMessage: (msg) => msg.ptvMessage?.caption,
  locationMessage: (msg) =>
    msg.locationMessage?.comment || msg.locationMessage?.name || msg.locationMessage?.address,
  contactMessage: (msg) => msg.contactMessage?.displayName,
  contactsArrayMessage: (msg) =>
    msg.contactsArrayMessage?.displayName || msg.contactsArrayMessage?.contacts?.[0]?.displayName,
  listMessage: (msg) =>
    msg.listMessage?.description || msg.listMessage?.title || msg.listMessage?.buttonText,
  buttonsMessage: (msg) =>
    msg.buttonsMessage?.contentText || msg.buttonsMessage?.footerText || msg.buttonsMessage?.text,
  interactiveMessage: (msg) => msg.interactiveMessage?.body?.text,
  pollCreationMessage: (msg) => msg.pollCreationMessage?.name,
  pollCreationMessageV2: (msg) => msg.pollCreationMessageV2?.name,
  pollCreationMessageV3: (msg) => msg.pollCreationMessageV3?.name,
  pollCreationMessageV5: (msg) => msg.pollCreationMessageV5?.name,
  groupInviteMessage: (msg) => msg.groupInviteMessage?.caption || msg.groupInviteMessage?.groupName,
  eventMessage: (msg) => msg.eventMessage?.name || msg.eventMessage?.description,
  reactionMessage: (msg) => msg.reactionMessage?.text,
  templateMessage: (msg) => msg.templateMessage?.hydratedTemplate?.hydratedContentText,
  newsletterAdminInviteMessage: (msg) => msg.newsletterAdminInviteMessage?.newsletterName,
  buttonsResponseMessage: (msg) =>
    msg.buttonsResponseMessage?.selectedDisplayText || msg.buttonsResponseMessage?.selectedButtonId,
  templateButtonReplyMessage: (msg) =>
    msg.templateButtonReplyMessage?.selectedDisplayText ||
    msg.templateButtonReplyMessage?.selectedId,
  listResponseMessage: (msg) =>
    msg.listResponseMessage?.title ||
    msg.listResponseMessage?.description ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId,
  interactiveResponseMessage: (msg) =>
    msg.interactiveResponseMessage?.body?.text ||
    msg.interactiveResponseMessage?.nativeFlowResponseMessage?.name ||
    msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson,
  questionResponseMessage: (msg) => msg.questionResponseMessage?.text,
};

export const getMessageText = (message: proto.IMessage, type: keyof proto.IMessage): string => {
  if (!message || !type) return '';
  const extractor = TEXT_MAP[type as keyof proto.IMessage];
  return (extractor ? extractor(message) : '') || '';
};

type NormalizedMessageWithText = NormalizedMessage & {
  text: string;
};
export const getNormalizedMessageWithText = (
  rawMessage?: proto.IMessage | null,
): NormalizedMessageWithText | undefined => {
  const normalized = getNormalizedMessage(rawMessage);
  if (!normalized) return;
  const { message, type } = normalized;
  const text = getMessageText(message, type);
  return { message, type, text };
};

export function getContextInfo(
  message?: proto.IMessage,
  type?: keyof proto.IMessage,
): proto.IContextInfo | undefined {
  if (!message || !type) return;
  const msgContent = message?.[type];
  if (!msgContent || typeof msgContent !== 'object' || !('contextInfo' in msgContent)) {
    return;
  }
  const contextInfo = msgContent?.contextInfo ?? undefined;
  return contextInfo;
}
