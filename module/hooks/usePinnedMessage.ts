import { useContext } from 'react';
import { RootContext } from '../store/rootContext';
import { eventHandler } from '../../eventHandler';
import { ChatType } from '../../module/types/messageType';

const usePinnedMessage = (params?: {
  conversation?: {
    conversationType?: ChatType;
    conversationId?: string;
  };
  pageSize?: number;
}) => {
  const rootStore = useContext(RootContext).rootStore;
  const { pinnedMessagesStore: pinStore } = rootStore;
  const { client } = rootStore;
  const { conversationId = '', conversationType = 'groupChat' } = params?.conversation || {};
  const { pageSize = 20 } = params || {};
  const { list = [], cursor = '' } = pinStore?.messages[conversationType][conversationId] || {};
  const { visible = false } = pinStore || {};
  const getPinnedMessages = () => {
    client
      .getServerPinnedMessages({
        conversationId,
        conversationType,
        pageSize,
        cursor: cursor as string,
      })
      .then(res => {
        res.data?.list.forEach(message => {
          pinStore.pushPinnedMessage(conversationType, conversationId, message);
        });
        pinStore.setPinnedMessageCursor(conversationType, conversationId, res.data?.cursor || null);
        eventHandler.dispatchSuccess('getPinnedMessages');
      })
      .catch((err: any) => {
        eventHandler.dispatchError('getPinnedMessages', err);
      });
  };

  const pinMessage = (messageId: string) => {
    client
      .pinMessage({
        conversationId,
        conversationType,
        messageId,
      })
      .then(() => {
        const time = Date.now();
        pinStore.updatePinnedMessage(conversationType, conversationId, messageId, time);
        pinStore.pushPinNoticeMessage({
          conversationId,
          conversationType,
          operatorId: client.user,
          noticeType: 'pin',
          time,
        });
        eventHandler.dispatchSuccess('pinMessage');
      })
      .catch(err => {
        eventHandler.dispatchError('pinMessage', err);
      });
  };

  const unpinMessage = (messageId: string) => {
    client
      .unpinMessage({
        conversationId,
        conversationType,
        messageId,
      })
      .then(() => {
        pinStore.deletePinnedMessage(conversationType, conversationId, messageId);
        pinStore.pushPinNoticeMessage({
          conversationId,
          conversationType,
          operatorId: client.user,
          noticeType: 'unpin',
          time: Date.now(),
        });
        eventHandler.dispatchSuccess('unpinMessage');
      })
      .catch(err => {
        eventHandler.dispatchError('unpinMessage', err);
      });
  };

  const show = () => {
    pinStore.changeVisible(true);
  };

  const hide = () => {
    pinStore.changeVisible(false);
  };

  const clearPinnedMessages = () => {
    pinStore.clearPinnedMessages(conversationType, conversationId);
  };

  return {
    list,
    cursor,
    pageSize,
    visible,
    show,
    hide,
    pinMessage,
    unpinMessage,
    getPinnedMessages,
    clearPinnedMessages,
  };
};

export { usePinnedMessage };
