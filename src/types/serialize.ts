import type { proto, WAMessageKey } from '@whiskeysockets/baileys';

export type SerializedMessage = {
  key: WAMessageKey;
  message: proto.IMessage;
  id: string;
  from: string;
  fromMe: boolean;
  sender: string;
  lid: string;
  pushName: string;
  type: string;
  expiration: number;
  messageTimestamp: number;
  mentions: string[];
  body: string;
  args: string[];
  query: string;
  command: string;
  prefix: string;
  isGroup: boolean;
  isOwner: boolean;
  quoted?: SerializedMessage;
};
