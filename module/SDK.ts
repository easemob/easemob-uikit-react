import {
  ChatClient,
  ChatManager,
  ChatRoomManager,
  ChatThreadManager,
  ContactManager,
  GroupManager,
  PresenceManager,
  PushManager,
  UserInfoManager,
} from 'easemob-websdk';
import { CallSignalingManager } from 'easemob-websdk/managers/call-signaling';
import type * as ChatSDK from 'easemob-websdk';

export const UIKitManagers = [
  ChatManager,
  ContactManager,
  GroupManager,
  ChatRoomManager,
  PresenceManager,
  PushManager,
  UserInfoManager,
  ChatThreadManager,
  CallSignalingManager,
] as const;

export {
  ChatClient,
  ChatManager,
  ChatRoomManager,
  ChatThreadManager,
  ContactManager,
  GroupManager,
  PresenceManager,
  PushManager,
  UserInfoManager,
  CallSignalingManager,
};

export type UIKitChatClient = ChatClient & {
  readonly chatManager: ChatManager;
  readonly contactManager: ContactManager;
  readonly groupManager: GroupManager;
  readonly chatRoomManager: ChatRoomManager;
  readonly presenceManager: PresenceManager;
  readonly pushManager: PushManager;
  readonly userInfoManager: UserInfoManager;
  readonly chatThreadManager: ChatThreadManager;
  readonly callSignalingManager: CallSignalingManager;
};

export type { ChatSDK };
