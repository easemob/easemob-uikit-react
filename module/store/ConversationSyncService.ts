import type { ChatSDK } from '../SDK';
import type { BaseMessageType } from '../baseMessage/BaseMessage';
import type { RootStore } from './index';
import type { Conversation } from './ConversationStore';
import {
  getConversationChatType,
  getConversationId,
  getConversationLastMessageTime,
} from '../utils/conversation';
import { isMessageFromCurrentUser } from '../utils/message';
import { AT_ALL } from '../messageInput/constants';

class ConversationSyncService {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  /**
   * Resolve display name for a newly created conversation.
   * Prefer addressStore, then SDK conversation list / joined groups (SDK 0.20.29+ may already
   * enrich group name after onMembersJoined).
   */
  private resolveConversationDisplayName(conversationType: string, conversationId: string): string {
    if (conversationType === 'groupChat') {
      const localGroup = this.rootStore.addressStore.groups.find(
        group => group.groupId === conversationId,
      );
      const localName = localGroup?.groupName || localGroup?.name || '';
      if (localName && localName !== conversationId) {
        return localName;
      }

      const client = this.rootStore.client as any;
      try {
        const sdkCvs = client?.chatManager
          ?.getConversationList?.()
          ?.find(
            (item: { conversationId?: string; conversationType?: string }) =>
              item.conversationId === conversationId && item.conversationType === 'groupChat',
          );
        const sdkCvsName = sdkCvs?.conversationName || '';
        if (sdkCvsName && sdkCvsName !== conversationId) {
          return sdkCvsName;
        }

        const sdkGroup = client?.groupManager
          ?.getJoinedGroupList?.()
          ?.find((group: { groupId?: string }) => group.groupId === conversationId);
        const sdkGroupName = sdkGroup?.name || '';
        if (sdkGroupName && sdkGroupName !== conversationId) {
          return sdkGroupName;
        }
      } catch {
        // ignore SDK read failures; conversation name can catch up via onConversationListUpdate
      }

      return localName;
    }

    return '';
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
    // Prefer conversationStore.currentCvs; keep messageStore.currentCVS as fallback.
    const currentCVS = conversationStore.currentCvs?.conversationId
      ? conversationStore.currentCvs
      : this.rootStore.messageStore.currentCVS;
    const isCurrentCvs =
      currentCVS.chatType === conversationType && currentCVS.conversationId === conversationId;

    let cvs: Conversation = conversationStore.getConversation(
      conversationType as any,
      conversationId,
    ) as unknown as Conversation;

    if (!cvs) {
      const name = this.resolveConversationDisplayName(conversationType, conversationId);
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

    const lastTime = getConversationLastMessageTime(cvs);
    const messageTime = message.timestamp || 0;
    if (lastTime < messageTime && !isCurrentCvs) {
      cvs.unreadCount = cvs.unreadCount + 1;
    }
    cvs.lastMessage = message as ChatSDK.Message;
    conversationStore.topConversation({ ...cvs });

    // @mention detection
    if (!isCurrentCvs && (message.type === 'txt' || message.type === 'text')) {
      const mentionList = message?.ext?.em_at_list;
      if (mentionList && !isMessageFromCurrentUser(message, currentUserId)) {
        if (mentionList === AT_ALL || mentionList.includes(currentUserId)) {
          const chatType = getConversationChatType(cvs);
          const cvsId = getConversationId(cvs);
          if (!chatType || !cvsId) return;
          conversationStore.setAtType(chatType, cvsId, mentionList === AT_ALL ? 'ALL' : 'ME');
        }
      }
    }
  }
}

export default ConversationSyncService;
