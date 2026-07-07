import type { ChatSDK } from '../SDK';
import type { MessageLike } from './message';

type AnyThread = Record<string, any>;
export type ThreadLike = Partial<ChatSDK.ChatThreadSummary> &
  Partial<ChatSDK.ChatThreadDetail> &
  Record<string, any>;

export const getThreadSummaryId = (thread?: ThreadLike) => {
  if (!thread) return '';
  const anyThread = thread as AnyThread;
  return anyThread.id || anyThread.chatThreadId || '';
};

export const getThreadParentId = (thread?: ThreadLike) => {
  if (!thread) return '';
  const anyThread = thread as AnyThread;
  return anyThread.parentId || '';
};

export const getThreadName = (thread?: ThreadLike) => {
  if (!thread) return '';
  const anyThread = thread as AnyThread;
  return anyThread.name || '';
};

export const getThreadOwnerId = (thread?: ThreadLike) => {
  if (!thread) return '';
  const anyThread = thread as AnyThread;
  return anyThread.ownerId || anyThread.owner || '';
};

export const getThreadMessageId = (thread?: ThreadLike) => {
  if (!thread) return '';
  const anyThread = thread as AnyThread;
  return anyThread.messageId || '';
};

export const getThreadMessageCount = (thread?: ThreadLike) => {
  if (!thread) return 0;
  const anyThread = thread as AnyThread;
  return anyThread.messageCount || anyThread.replyCount || 0;
};

export const getThreadLastMessage = (thread?: ThreadLike): MessageLike => {
  if (!thread) return undefined;
  const anyThread = thread as AnyThread;
  return anyThread.lastMessage;
};
