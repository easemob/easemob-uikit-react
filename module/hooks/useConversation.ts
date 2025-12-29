import { useContext } from 'react';
import { RootContext } from '../store/rootContext';
import { parseChannel } from '../utils';
import { eventHandler } from '../../eventHandler';

const pageSize = 20;
let cursor = '';
const useConversations = (includeEmptyConversations: boolean = false) => {
  const rootStore = useContext(RootContext).rootStore;
  const { client, conversationStore } = rootStore;
  const { hasConversationNext } = conversationStore;
  const getConversationList = () => {
    return client
      .getServerConversations({
        pageSize,
        cursor: cursor,
        includeEmptyConversations: includeEmptyConversations,
      })
      .then(res => {
        if ((res.data?.conversations?.length || 0) < pageSize) {
          conversationStore.setHasConversationNext(false);
        } else {
          conversationStore.setHasConversationNext(true);
          cursor = res.data?.cursor || '';
        }
        const conversation = res.data?.conversations
          ?.filter(cvs => {
            const { lastMessage } = cvs;
            // @ts-ignore
            if (lastMessage.chatThread) {
              return false;
            }
            return true;
          })
          ?.map(cvs => {
            return {
              chatType: cvs.conversationType,
              conversationId: cvs.conversationId,
              unreadCount: cvs.unReadCount,
              lastMessage: cvs.lastMessage,
            };
          });
        conversationStore.getSilentModeForConversations(conversation || []);
        //@ts-ignore
        conversationStore.setConversation(conversation);
        eventHandler.dispatchSuccess('getConversationlist');
      })
      .catch(err => {
        console.warn('get conversation list failed', err);
        eventHandler.dispatchError('getConversationlist', err);
      });
  };

  return { getConversationList, hasConversationNext };
};

const clearCursor = () => {
  cursor = '';
};
export { useConversations, clearCursor };
