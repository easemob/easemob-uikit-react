import type { ChatSDK, UIKitChatClient } from '../SDK';
import type { ChatType } from '../types/messageType';
import type { NoticeMessageBody } from '../noticeMessage/NoticeMessage';

export type UIKitMessage = ChatSDK.Message & {
  bySelf?: boolean;
  chatThreadOverview?: unknown;
  isChatThread?: boolean;
};

type AnyMessage = Record<string, any>;
export type MessageLike = Record<string, any> | NoticeMessageBody | null | undefined;

export const isSdk5Message = (message: unknown): message is ChatSDK.Message => {
  return Boolean(
    message &&
      typeof message === 'object' &&
      'msgLocalId' in message &&
      'conversationId' in message &&
      'conversationType' in message &&
      'body' in message,
  );
};

export const getCurrentUserId = (client?: Partial<UIKitChatClient> | null): string => {
  const getter = client?.getCurrentUserId;
  if (typeof getter === 'function') {
    return getter.call(client) || '';
  }
  return '';
};

export const getMessageId = (message?: MessageLike) => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  return anyMessage.msgServerId || anyMessage.msgLocalId || anyMessage.mid || anyMessage.id || '';
};

export const getMessageLocalId = (message?: MessageLike) => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  return anyMessage.msgLocalId || anyMessage.id || '';
};

export const getMessageServerId = (message?: MessageLike) => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  return anyMessage.msgServerId || anyMessage.mid || '';
};

export const getMessageTime = (message?: MessageLike) => {
  if (!message) return 0;
  const anyMessage = message as AnyMessage;
  return anyMessage.timestamp || anyMessage.time || 0;
};

export const getMessageChatType = (message?: MessageLike): ChatType | undefined => {
  if (!message) return undefined;
  const anyMessage = message as AnyMessage;
  return anyMessage.conversationType || anyMessage.chatType;
};

export const getMessageConversationId = (message: MessageLike, currentUserId = '') => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  if (anyMessage.noticeType || anyMessage.type === 'notice' || anyMessage.type === 'recall') {
    return '';
  }
  if (anyMessage.conversationId) {
    return anyMessage.conversationId as string;
  }
  if (anyMessage.chatType === 'groupChat' || anyMessage.chatType === 'chatRoom') {
    return anyMessage.to || '';
  }
  return anyMessage.from === currentUserId ? anyMessage.to || '' : anyMessage.from || '';
};

export const isMessageFromCurrentUser = (message: MessageLike, currentUserId: string) => {
  if (!message) return false;
  const anyMessage = message as AnyMessage;
  if (typeof anyMessage.bySelf === 'boolean') return anyMessage.bySelf;
  if (anyMessage.direct) return anyMessage.direct === 'SEND';
  return anyMessage.from === currentUserId || anyMessage.from === '';
};

export const getTextContent = (message: MessageLike) => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  if (anyMessage.body?.content) return anyMessage.body.content as string;
  return anyMessage.msg || '';
};

export const getCustomEvent = (message: MessageLike) => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  return anyMessage.body?.event || anyMessage.customEvent || '';
};

export const getCustomParams = (message: MessageLike) => {
  if (!message) return {};
  const anyMessage = message as AnyMessage;
  return anyMessage.body?.params || anyMessage.customExts || {};
};

export const getAttachmentUrl = (message: MessageLike) => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  return (
    anyMessage.body?.url ||
    anyMessage.body?.originalImageUrl ||
    anyMessage.body?.bigImageUrl ||
    anyMessage.body?.thumbnailUrl ||
    anyMessage.url ||
    anyMessage.file?.url ||
    anyMessage.thumb ||
    ''
  );
};

export const getThreadId = (thread?: unknown) => {
  if (!thread || typeof thread !== 'object') return '';
  const anyThread = thread as AnyMessage;
  return anyThread.chatThreadId || anyThread.id || '';
};

export const getMessageType = (message: MessageLike) => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  return anyMessage.type || anyMessage.body?.type || '';
};

export const getSnippetText = (message: MessageLike) => {
  if (!message) return '';
  const anyMessage = message as AnyMessage;
  return (
    anyMessage.body?.content ||
    anyMessage.body?.text ||
    anyMessage.body?.msg ||
    anyMessage.msg ||
    ''
  );
};
