// import { AgoraChat } from 'agora-chat';
import { ChatSDK } from '../module/SDK';
export type EventName =
  | 'joinChatRoom'
  | 'leaveChatRoom'
  | 'reportMessage'
  | 'getChatRoomDetails'
  | 'sendMessage'
  | 'fetchUserInfoById'
  | 'translateMessage'
  | 'recallMessage'
  | 'deleteConversation'
  | 'modifyMessage'
  | 'createChatThread'
  | 'destroyChatThread'
  | 'leaveChatThread'
  | 'setGroupMemberAttributes'
  | 'muteChatRoomMember'
  | 'getChatRoomMutelist'
  | 'unmuteChatRoomMember'
  | 'removeChatRoomMember'
  | 'getSilentModeForConversations'
  | 'setSilentModeForConversation'
  | 'clearRemindTypeForConversation'
  | 'getGroupInfo'
  | 'modifyGroup'
  | 'destroyGroup'
  | 'leaveGroup'
  | 'createGroup'
  | 'inviteToGroup'
  | 'removeGroupMembers'
  | 'changeGroupOwner'
  | 'pinConversation'
  | 'getServerPinnedConversations'
  | 'removeHistoryMessages'
  | 'addReaction'
  | 'deleteReaction'
  | 'getReactionDetail'
  | 'joinChatThread'
  | 'getChatThreads'
  | 'getChatThreadLastMessage'
  | 'getAllContacts'
  | 'getJoinedGroups'
  | 'open';

export type EventHandlerData = {
  [key in EventName]?: {
    success?: () => void;
    error?: (err: ChatSDK.ErrorEvent) => void;
  };
} & { onError: (err: ChatSDK.ErrorEvent) => void };

export class EventHandler {
  handlerData: { [key: string]: EventHandlerData } = {};
  private static instance: EventHandler;
  public static getInstance(): EventHandler {
    if (!EventHandler.instance) {
      EventHandler.instance = new EventHandler();
    }
    return EventHandler.instance;
  }

  constructor() {
    this.handlerData = {};
  }

  addEventHandler(eventHandlerId: string, eventHandler: EventHandlerData) {
    this.handlerData[eventHandlerId] = eventHandler;
  }

  removeEventHandler(eventHandlerId: string) {
    delete this.handlerData[eventHandlerId];
  }

  dispatchSuccess(eventName: EventName) {
    Object.keys(this.handlerData).forEach(key => {
      if (this.handlerData[key]?.[eventName] && this.handlerData[key][eventName]?.success) {
        this.handlerData[key][eventName]?.success?.();
      }
    });
  }

  dispatchError(eventName: EventName, error: ChatSDK.ErrorEvent) {
    Object.keys(this.handlerData).forEach(key => {
      if (this.handlerData[key]?.[eventName] && this.handlerData[key][eventName]?.error) {
        this.handlerData[key][eventName]?.error?.(error);
      }
      this.handlerData[key]?.onError?.(error);
      console.error(error);
    });
  }
}

export const eventHandler = EventHandler.getInstance();
