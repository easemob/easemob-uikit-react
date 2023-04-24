import { useCallback, useEffect, MutableRefObject, useContext, useState } from 'react';
import AC from 'agora-chat';
import { RootContext } from '../store/rootContext';
import { CurrentConversation } from '../store/ConversationStore';
const useHistoryMessages = (cvs: CurrentConversation) => {
  const rootStore = useContext(RootContext).rootStore;

  const { client, messageStore, conversationStore } = rootStore;
  let [historyMsgs, setHistoryMsgs] = useState<any>([]);

  const [cursor, setCursor] = useState(-1);

  useEffect(() => {
    if (!cvs.conversationId) {
      console.warn('Invalid conversationId:', cvs);
      return setHistoryMsgs([]);
    }

    const userId = rootStore.client.context.userId;
    let msg = historyMsgs[0] || {};
    const cvsId = msg.chatType == 'groupChat' ? msg.to : msg.from == userId ? msg.to : msg.from;
    let useCursor = cursor;
    if (cvs.conversationId != cvsId) {
      useCursor = -1;
    }

    rootStore.loginState &&
      client
        .getHistoryMessages({
          targetId: cvs.conversationId,
          cursor: useCursor,
          pageSize: 25,
          chatType: cvs.chatType,
          searchDirection: 'up',
        })
        .then(res => {
          console.log('历史消息', res);
          let msgs = res.messages.reverse();
          setHistoryMsgs(msgs || []);
        })
        .catch(err => {
          console.log('获取历史消息失败', err);
        });
  }, [cvs, cursor]);

  const loadMore = () => {
    const nextCursor = historyMsgs[0]?.id || -1;
    // console.log('我要加载更多', nextCursor);
    setCursor(nextCursor);
  };

  console.log('获取历史消息', historyMsgs);
  return { historyMsgs, loadMore };
};

export { useHistoryMessages };
