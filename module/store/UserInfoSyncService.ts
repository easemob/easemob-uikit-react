import type { BaseMessageType } from '../baseMessage/BaseMessage';
import type { RootStore } from './index';

class UserInfoSyncService {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  /** Extract user info from message ext and sync to addressStore */
  syncOnMessageReceived(message: BaseMessageType, conversationType: string): void {
    const addressStore = this.rootStore.addressStore;

    if (conversationType === 'chatRoom') {
      const ext = (message as any).ext || {};
      const senderInfo =
        typeof ext.chatroom_uikit_userInfo === 'string'
          ? JSON.parse(ext.chatroom_uikit_userInfo)
          : ext.chatroom_uikit_userInfo || {};
      if (!senderInfo.userId) return;
      addressStore.mergeAppUserInfo({
        [senderInfo.userId]: {
          nickname: senderInfo.nickname,
          userId: senderInfo.userId,
          avatarUrl: senderInfo.avatarUrl ?? senderInfo.avatarURL,
          avatarurl: senderInfo.avatarurl ?? senderInfo.avatarURL,
          gender: senderInfo.gender,
        },
      });
    } else {
      if (message.ext && message.ext.ease_chat_uikit_user_info && message.from) {
        if (addressStore.appUsersInfo[message.from] === undefined) {
          addressStore.mergeAppUserInfo({
            [message.from]: {
              nickname: message.ext.ease_chat_uikit_user_info.nickname,
              userId: message.from,
              avatarUrl:
                message.ext.ease_chat_uikit_user_info.avatarUrl ??
                message.ext.ease_chat_uikit_user_info.avatarURL,
              avatarurl:
                message.ext.ease_chat_uikit_user_info.avatarurl ??
                message.ext.ease_chat_uikit_user_info.avatarURL,
            },
          });
        }
      }
    }
  }
}

export default UserInfoSyncService;
