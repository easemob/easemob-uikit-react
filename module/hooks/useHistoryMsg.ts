import { useEffect, useContext, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { CurrentConversation } from '../store/ConversationStore';
import { ChatType } from '../types/messageType';
import {
  getCurrentUserId,
  getMessageConversationId,
  getMessageId,
  getMessageServerId,
} from '../utils';

const cache: { [key: string]: boolean } = {};

const getHistoryCursor = (message: unknown): string => {
  const serverId = getMessageServerId(message as any);
  return /^\d+$/.test(serverId) ? serverId : '';
};

export function resetCache(chatType: ChatType, conversationId: string) {
  cache[`${chatType}${conversationId}`] = false;
}

const useHistoryMessages = (cvs: CurrentConversation) => {
  const rootStore = useContext(RootContext).rootStore;

  const { client, messageStore } = rootStore;
  const [historyMsgs, setHistoryMsgs] = useState<any>([]);

  const [cursor, setCursor] = useState<number | string>(-1);
  const [isLoading, setLoading] = useState(false);
  const pageSize = 40;

  useEffect(() => {
    if (!cvs.conversationId) {
      console.warn('Invalid conversationId:', cvs);
      return;
    }
    if (!rootStore.loginState) return;
    const currentChatMsgs = messageStore.message[cvs.chatType][cvs.conversationId] || [];
    // 第一次加载过的缓存和加载更多之后的缓存
    if (
      currentChatMsgs.length > 0 &&
      (cursor === -1 || cursor != getHistoryCursor(currentChatMsgs[0])) &&
      cache[`${cvs.chatType}${cvs.conversationId}`]
    ) {
      return setHistoryMsgs(currentChatMsgs);
    }

    const userId = getCurrentUserId(rootStore.client);
    if (!userId) return;
    const msg = historyMsgs[0] || {};
    const cvsId = getMessageConversationId(msg, userId);
    let useCursor = cursor;
    if (cvs.conversationId != cvsId) {
      useCursor = -1;
    }

    if (currentChatMsgs.length > 0) {
      const message = currentChatMsgs.find(msg => {
        return msg.type !== 'notice' && msg.type !== 'recall' && Boolean(getHistoryCursor(msg));
      });
      if (message) {
        useCursor = getHistoryCursor(message);
      } else {
        useCursor = -1;
      }
    }

    setLoading(true);
    rootStore.loginState &&
      client.chatManager
        .getHistoryMessages({
          conversationId: cvs.conversationId,
          cursor: useCursor === -1 ? undefined : String(useCursor),
          pageSize: pageSize,
          conversationType: cvs.chatType as 'singleChat' | 'groupChat',
          searchDirection: 'up',
        })
        .then(res => {
          cache[`${cvs.chatType}${cvs.conversationId}`] = true;
          let msgs = [...res.items].reverse();

          // 连续调用，第一次没返回又调用第二次，两次结果是一样的
          if (msgs.length > 0) {
            let hasMsg = false;
            const currentChatMsgs = messageStore.message[cvs.chatType][cvs.conversationId] || [];
            currentChatMsgs.forEach(msg => {
              if (getMessageId(msg) == getMessageId(msgs[0])) {
                hasMsg = true;
              }
            });
            if (hasMsg) return;
            setHistoryMsgs(msgs);

            // 去重，防止接口慢，新发的消息也拉回来，导致重复
            msgs = msgs.filter((msg: any) => {
              return !currentChatMsgs?.find?.(item => {
                return getMessageId(item) === getMessageId(msg);
              });
            });
            messageStore.addHistoryMsgs(cvs, msgs);
          }
          setLoading(false);
        })
        .catch(err => {
          console.warn('get history messages failed', err);
          setLoading(false);
        });
  }, [cvs.conversationId, cursor, rootStore.loginState]);

  const loadMore = () => {
    const currentChatMsgs = messageStore.message[cvs.chatType][cvs.conversationId] || [];
    const earliestServerMessage = currentChatMsgs.find(msg => Boolean(getHistoryCursor(msg)));
    let nextCursor: number | string = earliestServerMessage
      ? getHistoryCursor(earliestServerMessage)
      : -1;
    const msg: any = earliestServerMessage || {};
    const userId = getCurrentUserId(rootStore.client);
    const cvsId = getMessageConversationId(msg, userId);
    if (cvs.conversationId != cvsId) {
      nextCursor = -1;
    }
    setCursor(nextCursor);
  };

  return { historyMsgs, loadMore, isLoading };
};

export { useHistoryMessages };
