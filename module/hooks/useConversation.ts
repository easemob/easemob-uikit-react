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
    client
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
        const conversation = res.data?.channel_infos?.map(cvs => {
          const { chatType, conversationId } = parseChannel(cvs.channel_id);
          return {
            chatType,
            conversationId,
            unreadCount: cvs.unread_num,
            lastMessage: cvs.lastMessage,
          };
        });
        //@ts-ignore
        conversationStore.setConversation(conversation);
      })
      .catch(err => {
        console.log('分页获取会话列表失败 ******', err);
      });
  };

  return { getConversationList, hasConversationNext };
};

export { useConversations };
