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
    try {
      const res = client.chatManager.getConversationList();
      const conversation = res
        ?.filter(cvs => {
          if (!includeEmptyConversations && !cvs.lastMessage) {
            return false;
          }
          const { lastMessage = {} } = cvs;
          // @ts-ignore
          if (lastMessage?.chatThread) {
            return false;
          }
          return true;
        })
        ?.map(cvs => {
          return {
            chatType: cvs.conversationType,
            conversationId: cvs.conversationId,
            unreadCount: cvs.unreadCount,
            lastMessage: cvs.lastMessage || {},
            isPinned: cvs.isPinned,
            name: cvs.conversationName,
            avatarUrl: cvs.conversationAvatar,
          };
        });
      conversationStore.setHasConversationNext(false);
      conversationStore.getSilentModeForConversations(conversation || []);
      //@ts-ignore
      conversationStore.setConversation(conversation);
      eventHandler.dispatchSuccess('getConversationlist');
      return Promise.resolve();
    } catch (err) {
      console.warn('get conversation list failed', err);
      eventHandler.dispatchError('getConversationlist', err);
      return Promise.reject(err);
    }
  };

  return { getConversationList, hasConversationNext };
};

const clearCursor = () => {
  cursor = '';
};
export { useConversations, clearCursor };
