import { useCallback, useEffect, MutableRefObject, useContext, useState, useRef } from 'react';
import { RootContext } from '../store/rootContext';
import { CurrentConversation } from '../store/ConversationStore';

const cache: { [key: string]: boolean } = {};

const useHistoryMessages = (cvs: CurrentConversation) => {
  const rootStore = useContext(RootContext).rootStore;

  const { client, messageStore, conversationStore } = rootStore;
  let [historyMsgs, setHistoryMsgs] = useState<any>([]);

  const [cursor, setCursor] = useState<number | string>(-1);
  const [isLoading, setLoading] = useState(false);
  const pageSize = 25;

  useEffect(() => {
    if (!cvs.conversationId) {
      console.warn('Invalid conversationId:', cvs);
      return;
    }

    const currentChatMsgs = messageStore.message[cvs.chatType][cvs.conversationId] || [];
    // 第一次加载过的缓存和加载更多之后的缓存
    if (
      currentChatMsgs.length > 0 &&
      (cursor === -1 || cursor != currentChatMsgs[0].id) &&
      cache[`${cvs.chatType}${cvs.conversationId}`]
    ) {
      return setHistoryMsgs(currentChatMsgs);
    }

    const userId = rootStore.client?.context?.userId;
    if (!userId) return;
    let msg = historyMsgs[0] || {};
    const cvsId = msg.chatType == 'groupChat' ? msg.to : msg.from == userId ? msg.to : msg.from;
    let useCursor = cursor;
    if (cvs.conversationId != cvsId) {
      useCursor = -1;
    }

    if (currentChatMsgs.length > 0) {
      const message = currentChatMsgs.find(msg => {
        return msg.type !== 'notice' && msg.type !== 'recall';
      });
      if (message) {
        //@ts-ignore
        useCursor = message.mid || message.id;
      }
    }

    setLoading(true);
    rootStore.loginState &&
      client
        .getHistoryMessages({
          targetId: cvs.conversationId,
          cursor: useCursor,
          pageSize: pageSize,
          chatType: cvs.chatType as 'singleChat' | 'groupChat',
          searchDirection: 'up',
        })
        .then(res => {
          cache[`${cvs.chatType}${cvs.conversationId}`] = true;
          let msgs = res.messages.reverse();

          // 连续调用，第一次没返回又调用第二次，两次结果是一样的
          if (msgs.length > 0) {
            let hasMsg = false;
            const currentChatMsgs = messageStore.message[cvs.chatType][cvs.conversationId] || [];
            currentChatMsgs.forEach(msg => {
              if (msg.id == msgs[0].id) {
                hasMsg = true;
              }
            });
            if (hasMsg) return;
            setHistoryMsgs(msgs);
            messageStore.addHistoryMsgs(cvs, msgs);
          }
          setLoading(false);
        })
        .catch(err => {
          console.warn('get history messages failed', err);
          setLoading(false);
        });
  }, [cvs.conversationId, cursor]);

  const loadMore = () => {
    let nextCursor = historyMsgs[0]?.mid || historyMsgs[0]?.id || -1;
    let msg = historyMsgs[0] || {};
    const userId = rootStore.client.context.userId;
    const cvsId = msg.chatType == 'groupChat' ? msg.to : msg.from == userId ? msg.to : msg.from;
    if (cvs.conversationId != cvsId) {
      nextCursor = -1;
    }
    setCursor(nextCursor);
  };

  return { historyMsgs, loadMore, isLoading };
};

export { useHistoryMessages };
