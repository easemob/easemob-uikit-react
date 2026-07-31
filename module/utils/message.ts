import type { ChatSDK, UIKitChatClient } from '../SDK';
import type { ChatType } from '../types/messageType';
import type { NoticeMessageBody } from '../noticeMessage/NoticeMessage';

export type UIKitMessage = ChatSDK.Message & {
  bySelf?: boolean;
  chatThreadOverview?: unknown;
  isChatThread?: boolean;
  /** UIKit-only: peer delivery ack received for an outgoing single-chat message. */
  isDelivered?: boolean;
};

export type MessageDisplayStatus =
  | 'sending'
  | 'sent'
  | 'received'
  | 'read'
  | 'failed'
  | 'unread'
  | 'default';

/**
 * Derive UI message status from SDK 0.20 fields:
 * - sendStatus: sending | sent | failed
 * - isPeerRead: single-chat peer read
 * - groupReadCount: group cumulative read count
 * - isDelivered: UIKit overlay from onMessageDelivered
 */
export const getMessageDisplayStatus = (message?: MessageLike): MessageDisplayStatus => {
  if (!message) return 'default';
  const anyMessage = message as AnyMessage;
  const sendStatus = anyMessage.sendStatus || anyMessage.status;

  if (sendStatus === 'failed') return 'failed';
  if (sendStatus === 'sending') return 'sending';

  if (anyMessage.isPeerRead === true) return 'read';
  if (typeof anyMessage.groupReadCount === 'number' && anyMessage.groupReadCount > 0) {
    return 'read';
  }
  // Legacy UIKit status overlay / delivery overlay
  if (anyMessage.status === 'read') return 'read';
  if (anyMessage.isDelivered === true || anyMessage.status === 'received') return 'received';
  if (sendStatus === 'sent' || anyMessage.status === 'sent') return 'sent';
  if (anyMessage.status === 'unread') return 'unread';
  return 'default';
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

export type MessagePreviewTokenStyle = 'slash' | 'bracket';
export type MessagePreviewData = {
  mode: 'renderText' | 'plainText' | 'empty';
  text: string;
};

type MessagePreviewOptions = {
  tokenStyle?: MessagePreviewTokenStyle;
  combineLabelKey?: string;
  mapUserCardToContact?: boolean;
  mapCombinedTextSentinel?: boolean;
};

const formatPreviewToken = (label: string, style: MessagePreviewTokenStyle) => {
  if (!label) return '';
  return style === 'slash' ? `/${label}/` : `[${label}]`;
};

export const getMessagePreviewData = (
  message: MessageLike,
  t: (key: string) => string,
  options: MessagePreviewOptions = {},
): MessagePreviewData => {
  if (!message) {
    return { mode: 'empty', text: '' };
  }

  const {
    tokenStyle = 'bracket',
    combineLabelKey = 'chatHistory',
    mapUserCardToContact = false,
    mapCombinedTextSentinel = false,
  } = options;

  const type = getMessageType(message);
  switch (type) {
    case 'txt':
    case 'text': {
      const text = getTextContent(message);
      if (mapCombinedTextSentinel && text === 'the combine message') {
        return {
          mode: 'plainText',
          text: formatPreviewToken(t('chatHistory'), 'slash'),
        };
      }
      return {
        mode: text ? 'renderText' : 'empty',
        text,
      };
    }
    case 'img':
    case 'image':
      return { mode: 'plainText', text: formatPreviewToken(t('image'), tokenStyle) };
    case 'audio':
    case 'voice':
      return { mode: 'plainText', text: formatPreviewToken(t('audio'), tokenStyle) };
    case 'file':
      return { mode: 'plainText', text: formatPreviewToken(t('file'), tokenStyle) };
    case 'video':
      return { mode: 'plainText', text: formatPreviewToken(t('video'), tokenStyle) };
    case 'custom':
      if (mapUserCardToContact && getCustomEvent(message) === 'userCard') {
        return { mode: 'plainText', text: formatPreviewToken(t('contact'), tokenStyle) };
      }
      return { mode: 'plainText', text: formatPreviewToken(t('custom'), tokenStyle) };
    case 'combine':
      return {
        mode: 'plainText',
        text: formatPreviewToken(t(combineLabelKey), tokenStyle),
      };
    case 'recall':
      return { mode: 'plainText', text: t('unsentAMessage') };
    default:
      return { mode: 'empty', text: '' };
  }
};
