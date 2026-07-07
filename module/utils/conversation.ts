import type { ChatType } from '../types/messageType';
import { getMessageTime, type MessageLike } from './message';

type AnyConversation = Record<string, any>;
export type ConversationLike =
  | (Record<string, any> & {
      chatType?: ChatType;
      conversationType?: ChatType;
      conversationId?: string;
      id?: string;
      lastMessage?: MessageLike;
      latestMessage?: MessageLike;
      unreadCount?: number;
      unreadNum?: number;
      name?: string;
      conversationName?: string;
      isPinned?: boolean;
      pinned?: boolean;
      silent?: boolean;
    })
  | null
  | undefined;

export const getConversationId = (conversation?: ConversationLike) => {
  if (!conversation) return '';
  const anyConversation = conversation as AnyConversation;
  return anyConversation.conversationId || anyConversation.id || '';
};

export const getConversationChatType = (conversation?: ConversationLike): ChatType | undefined => {
  if (!conversation) return undefined;
  const anyConversation = conversation as AnyConversation;
  return anyConversation.chatType || anyConversation.conversationType;
};

export const getConversationName = (conversation?: ConversationLike) => {
  if (!conversation) return '';
  const anyConversation = conversation as AnyConversation;
  return anyConversation.name || anyConversation.conversationName || '';
};

export const getConversationUnreadCount = (conversation?: ConversationLike) => {
  if (!conversation) return 0;
  const anyConversation = conversation as AnyConversation;
  return anyConversation.unreadCount || anyConversation.unreadNum || 0;
};

export const isConversationPinned = (conversation?: ConversationLike) => {
  if (!conversation) return false;
  const anyConversation = conversation as AnyConversation;
  return Boolean(anyConversation.isPinned || anyConversation.pinned);
};

export const isConversationSilent = (conversation?: ConversationLike) => {
  if (!conversation) return false;
  const anyConversation = conversation as AnyConversation;
  return Boolean(anyConversation.silent);
};

export const getConversationLastMessage = (conversation?: ConversationLike): MessageLike => {
  if (!conversation) return undefined;
  const anyConversation = conversation as AnyConversation;
  return anyConversation.lastMessage || anyConversation.latestMessage;
};

export const getConversationLastMessageTime = (conversation?: ConversationLike) => {
  return getMessageTime(getConversationLastMessage(conversation));
};

export const toConversationKey = (conversation?: ConversationLike) => {
  const chatType = getConversationChatType(conversation);
  const conversationId = getConversationId(conversation);
  if (!chatType || !conversationId) return '';
  return `${chatType}_${conversationId}`;
};
