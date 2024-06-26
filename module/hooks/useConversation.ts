import { useContext } from 'react';
import { RootContext } from '../store/rootContext';
import { parseChannel } from '../utils';

const pageSize = 20;
let pageNum = 1;
const useConversations = () => {
  const rootStore = useContext(RootContext).rootStore;
  const { client, conversationStore } = rootStore;
  const { hasConversationNext } = conversationStore;
  const getConversationList = () => {
    return client
      .getConversationlist({
        pageSize,
        pageNum: pageNum,
      })
      .then(res => {
        if ((res.data?.channel_infos?.length || 0) < pageSize) {
          conversationStore.setHasConversationNext(false);
        } else {
          conversationStore.setHasConversationNext(true);
          pageNum++;
        }
        const conversation = res.data?.channel_infos
          ?.filter(cvs => {
            const { lastMessage } = cvs;
            // @ts-ignore
            if (lastMessage.chatThread) {
              return false;
            }
            return true;
          })
          ?.map(cvs => {
            const { chatType, conversationId } = parseChannel(cvs.channel_id);
            return {
              chatType,
              conversationId,
              unreadCount: cvs.unread_num,
              lastMessage: cvs.lastMessage,
            };
          });
        conversationStore.getSilentModeForConversations(conversation || []);
        //@ts-ignore
        conversationStore.setConversation(conversation);
      })
      .catch(err => {
        console.warn('get conversation list failed', err);
      });
  };

  return { getConversationList, hasConversationNext };
};

const clearPageNum = () => {
  pageNum = 1;
};
export { useConversations, clearPageNum };
