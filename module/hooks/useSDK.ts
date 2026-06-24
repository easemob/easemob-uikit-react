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
} from '../SDK';

const useSDK = () => {
  return {
    ChatSDK: {
      ChatClient,
      ChatManager,
      ChatRoomManager,
      ChatThreadManager,
      ContactManager,
      GroupManager,
      PresenceManager,
      PushManager,
      UserInfoManager,
    },
    ChatSDKType: null as unknown as typeof import('easemob-websdk'),
  };
};

export { useSDK };
