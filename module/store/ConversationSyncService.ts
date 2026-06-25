import type { ChatSDK } from '../SDK';
import type { BaseMessageType } from '../baseMessage/BaseMessage';
import type { RootStore } from './index';
import type { Conversation } from './ConversationStore';
import { getMessageTime, isMessageFromCurrentUser } from '../utils';
import { AT_ALL } from '../messageInput/suggestList/SuggestList';

class ConversationSyncService {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  /** Sync conversation list when a non-chatRoom message is received */
  syncOnMessageReceived(
    message: BaseMessageType,
    conversationId: string,
    conversationType: string,
    currentUserId: string,
  ): void {
    if (conversationType === 'chatRoom') return;
    if ((message as any).isChatThread || (message as any).chatThread) return;
    if (message.type === 'cmd') return;

    const conversationStore = this.rootStore.conversationStore;
    const currentCVS = this.rootStore.messageStore.currentCVS;
    const isCurrentCvs =
      currentCVS.chatType === conversationType && currentCVS.conversationId === conversationId;

    let cvs: Conversation = conversationStore.getConversation(
      conversationType as any,
      conversationId,
    ) as unknown as Conversation;

    if (!cvs) {
      let name = '';
      this.rootStore.addressStore.groups.forEach(group => {
        if (conversationId === group.groupId) {
          name = group.groupName || group.name || '';
        }
      });
      cvs = {
        chatType: conversationType as any,
        conversationId,
        lastMessage: message as ChatSDK.Message,
        unreadCount: isCurrentCvs ? 0 : 1,
        name,
      };
      conversationStore.addConversation(cvs);
      return;
    }

    const lastTime = getMessageTime(cvs.lastMessage);
    if (lastTime < getMessageTime(message) && !isCurrentCvs) {
      cvs.unreadCount = cvs.unreadCount + 1;
    }
    cvs.lastMessage = message as ChatSDK.Message;
    conversationStore.topConversation({ ...cvs });

    // @mention detection
    if (!isCurrentCvs && (message.type === 'txt' || message.type === 'text')) {
      const mentionList = message?.ext?.em_at_list;
      if (mentionList && !isMessageFromCurrentUser(message, currentUserId)) {
        if (mentionList === AT_ALL || mentionList.includes(currentUserId)) {
          conversationStore.setAtType(
            cvs.chatType,
            cvs.conversationId,
            mentionList === AT_ALL ? 'ALL' : 'ME',
          );
        }
      }
    }
  }
}

export default ConversationSyncService;
