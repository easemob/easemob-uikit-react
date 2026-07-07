import { ChatType } from '../types/messageType';
import type { ChatSDK } from '../SDK';
import rootStore, { getStore } from '../store/index';
import { GroupItem, MemberItem } from '../store/AddressStore';
import { emoji } from '../messageInput/emoji/emojiConfig';
import { AppUserInfo } from '../store/AddressStore';
import { CurrentConversation } from '../store/ConversationStore';
import type { BaseMessageType } from '../baseMessage/BaseMessage';
import { NoticeMessageBody } from '../noticeMessage/NoticeMessage';
import {
  getCurrentUserId,
  getMessageConversationId,
  getMessageId,
  getMessageTime,
} from './message';
import { getConversationLastMessageTime, isConversationPinned } from './conversation';

export * from './message';
export * from './conversation';
export * from './thread';

export function getConversationTime(time: number) {
  if (!time) return '';
  // ['Fri', 'Jun', '10', '2022', '14:16:28', 'GMT+0800', '(中国标准时间)']
  //    0       1      2      3       4
  const localTimeList = new Date().toString().split(' ');
  const MsgTimeList = new Date(time).toString().split(' ');
  if (localTimeList[3] === MsgTimeList[3]) {
    if (localTimeList[1] === MsgTimeList[1]) {
      if (localTimeList[0] === MsgTimeList[0]) {
        if (localTimeList[2] === MsgTimeList[2]) {
          return MsgTimeList[4].substr(0, 5);
        }
      } else {
        if (Number(localTimeList[0]) - Number(MsgTimeList[0]) === 1) {
          return 'Yday';
        } else {
          return MsgTimeList[0];
        }
      }
    } else {
      return MsgTimeList[1];
    }
  } else {
    return MsgTimeList[1];
  }
}

export function parseChannel(channelId: string): {
  chatType: ChatType;
  conversationId: string;
} {
  const reg = /_(\S*)@/;
  const chatType = channelId.includes('@conference') ? 'groupChat' : 'singleChat';
  const conversationId = channelId.match(reg)?.[1] || '';
  return {
    chatType,
    conversationId,
  };
}

export function getCvsIdFromMessage(
  message: Partial<ChatSDK.Message> | BaseMessageType | NoticeMessageBody,
) {
  return getMessageConversationId(message, getCurrentUserId(rootStore.client));
}

export function getEmojiHtml({ src = '', dataKey = '', alt = '' }) {
  return `<span><img  crossOrigin="anonymous" src=${src} data-key=${dataKey} alt=${alt} width="20" height="20" style="vertical-align: middle" /></span>`;
}

export const renderHtml = (txt: string): string => {
  if (txt === undefined) {
    return '';
  }
  let rnTxt = '';
  let match = null;
  const regex = /(\[.*?\])/g;
  let start = 0;
  let index = 0;
  while ((match = regex.exec(txt))) {
    index = match.index;
    if (index > start) {
      rnTxt += txt.substring(start, index);
    }
    if (match[1] in emoji.map) {
      const v = emoji.map[match[1] as keyof typeof emoji.map];
      rnTxt += getEmojiHtml({
        src: new URL(`/module/assets/reactions/${v}`, import.meta.url).href,
        dataKey: match[1],
        alt: match[1],
      });
    } else {
      rnTxt += match[1];
    }
    start = index + match[1].length;
  }
  rnTxt += txt.substring(start, txt.length);
  return rnTxt;
};

export function getUsersInfo(props: {
  userIdList: string[];
  withPresence?: boolean;
  force?: boolean;
}) {
  const { userIdList, withPresence = true, force = false } = props;
  const { client, addressStore, conversationStore } = getStore();
  const currentUserId = getCurrentUserId(client);
  if (!currentUserId) return Promise.reject('client is not initialized');
  const normalizedUserIds = Array.from(new Set(userIdList.filter(Boolean)));
  const requestUserIds = force
    ? normalizedUserIds
    : normalizedUserIds.filter(userId => !addressStore.hasUserInfo(userId));
  const presenceUserIds = normalizedUserIds.filter(userId => userId !== currentUserId);
  if (presenceUserIds.length > 0 && withPresence) {
    client.presenceManager
      .subscribePresence({ userIds: presenceUserIds, expiry: 2592000 })
      .catch(err => {
        console.warn('subscribePresence failed', err);
      });
  }

  return new Promise((resolve, reject) => {
    if (requestUserIds.length === 0) {
      resolve({});
      return;
    }
    if (rootStore.userInfoProvider) {
      Promise.resolve(rootStore.userInfoProvider(requestUserIds))
        .then(res => {
          const reUserInfo = addressStore.normalizeAppUsersInfo(res);
          if (withPresence) {
            client.presenceManager
              .getPresenceStatus({ userIds: normalizedUserIds })
              .then(res => {
                res.forEach(item => {
                  if (reUserInfo[item.publisher]) {
                    reUserInfo[item.publisher].presenceExt = item.ext;
                    if (
                      Object.prototype.toString.call(item.statusList) === '[object Object]' &&
                      Object.values(item.statusList).indexOf(1) > -1
                    ) {
                      reUserInfo[item.publisher].isOnline = true;
                    }
                  }
                });
                conversationStore.setOnlineStatus(res);
                addressStore.mergeAppUserInfo(reUserInfo);
                resolve(reUserInfo);
              })
              .catch(e => {
                reject(e);
              });
            return;
          }
          addressStore.mergeAppUserInfo(reUserInfo);
          resolve(reUserInfo);
        })
        .catch(e => {
          reject(e);
        });
      return;
    }
    if (rootStore.initConfig.useUserInfo === false) {
      resolve({});
      return;
    }
    const type = [
      'nickname',
      'avatarUrl',
      'mail',
      'phone',
      'gender',
      'sign',
      'birth',
      'ext',
    ] as ChatSDK.UserInfoAttribute[];
    const reUserInfo: Record<string, AppUserInfo> = {};
    requestUserIds.forEach(item => {
      reUserInfo[item] = {
        userId: item,
        isOnline: false,
      };
    });
    client.userInfoManager
      .getUserInfoByAttribute({ userIds: requestUserIds, attributes: type })
      .then(res => {
        res.forEach(item => {
          const userInfo = reUserInfo[item.userId];
          if (userInfo) {
            userInfo.nickname = item.nickname || '';
            userInfo.avatarUrl = item.avatarUrl || '';
            userInfo.avatarurl = item.avatarUrl || '';
            userInfo.mail = item.mail || '';
            userInfo.phone = item.phone || '';
            userInfo.gender = String(item.gender || '');
            userInfo.sign = item.sign || '';
            userInfo.birth = item.birth || '';
            userInfo.ext = item.ext ? JSON.parse(item.ext) : '';
          }
        });
        if (withPresence) {
          client.presenceManager
            .getPresenceStatus({ userIds: normalizedUserIds })
            .then(res => {
              res.forEach(item => {
                if (reUserInfo[item.publisher]) {
                  reUserInfo[item.publisher].presenceExt = item.ext;
                  if (
                    Object.prototype.toString.call(item.statusList) === '[object Object]' &&
                    Object.values(item.statusList).indexOf(1) > -1
                  ) {
                    reUserInfo[item.publisher].isOnline = true;
                  }
                }
              });
              conversationStore.setOnlineStatus(res);
              addressStore.mergeAppUserInfo(reUserInfo);
              resolve(reUserInfo);
            })
            .catch(e => {
              reject(e);
            });
        } else {
          addressStore.mergeAppUserInfo(reUserInfo);
          resolve(reUserInfo);
        }
      })
      .catch(e => {
        reject(e);
      });
  });
}

export const formatHtmlString = (str: string) =>
  //@ts-ignore
  str?.replace(/[\u00A0-\u9999<>]/gim, i => ''.concat('&#', i.charCodeAt(0), ';'));

export function getGroupItemFromGroupsById(groupId: string) {
  const { addressStore } = rootStore;
  return addressStore.groups.find(item => item.groupId === groupId);
}

export function getGroupItemIndexFromGroupsById(groupId: string) {
  const { addressStore } = rootStore;
  return addressStore.groups.findIndex(item => item.groupId === groupId);
}

export function getGroupMemberIndexByUserId(group: GroupItem, userId: string) {
  return group?.members?.findIndex(item => userId === item.userId);
}

export function getGroupMemberNickName(member: MemberItem) {
  return (
    member.attributes?.nickName ||
    rootStore.addressStore.resolveUserInfo(member.userId).nickname ||
    member.userId
  );
}

export function getAppUserInfo(userId: string) {
  return rootStore.addressStore.resolveUserInfo(userId);
}

export function getMessages(cvs: CurrentConversation) {
  const { message } = rootStore.messageStore;
  return message[cvs.chatType][cvs.conversationId];
}

export function getMessageIndex(
  messages: (ChatSDK.Message | NoticeMessageBody)[],
  messageId: string,
) {
  if (!messages) return -1;
  return messages.findIndex(msg => getMessageId(msg) === messageId);
}

export function getReactionByEmoji(message: ChatSDK.Message | NoticeMessageBody, emoji: string) {
  // @ts-ignore
  return message.reactions?.find(reaction => reaction.reaction === emoji);
}

export const getMsgSenderNickname = (
  msg: {
    from?: string;
    to?: string;
    conversationId?: string;
    conversationType?: ChatType;
    chatType?: ChatType;
    chatThread?: { parentId?: string };
  },
  parentId?: string,
) => {
  let chatType = msg.chatType || msg.conversationType;
  let { from = '', to, chatThread } = msg;
  const id = parentId || chatThread?.parentId;
  if (id) {
    to = id;
  }
  to = to || msg.conversationId;
  const { appUsersInfo, contacts } = getStore().addressStore;
  if (chatType === 'groupChat') {
    const group = getGroupItemFromGroupsById(to || '');

    const contactData = contacts.find((contact: any) => {
      return contact.userId === from;
    });

    if (contactData && contactData.remark) {
      return contactData.remark;
    }

    const memberIndex = (group && getGroupMemberIndexByUserId(group, from)) ?? -1;
    if (memberIndex > -1) {
      const memberItem = group?.members?.[memberIndex];
      if (memberItem) {
        return getGroupMemberNickName(memberItem) || appUsersInfo?.[from]?.nickname || from;
      }
      return appUsersInfo?.[from]?.nickname || from;
    }

    return appUsersInfo?.[from]?.nickname || from;
  } else {
    return appUsersInfo?.[from]?.nickname || from;
  }
};

export function sortByPinned(a: any, b: any) {
  const aPinned = isConversationPinned(a);
  const bPinned = isConversationPinned(b);
  if (aPinned && !bPinned) {
    return -1; // a排在b前面
  } else if (!aPinned && bPinned) {
    return 1; // b排在a前面
  } else if ((!aPinned && !bPinned) || (aPinned && bPinned)) {
    const aTime = getConversationLastMessageTime(a);
    const bTime = getConversationLastMessageTime(b);
    if (!aTime) {
      return 0;
    }
    return aTime > bTime ? -1 : 1; // 保持原有顺序
  } else {
    return 0; // 保持原有顺序
  }
}

export function checkCharacter(character: string) {
  const pattern = /[\u4E00-\u9FA5]/; // 中文字符的unicode范围
  const isChinese = pattern.test(character);
  const isLetter = /^[a-zA-Z]$/.test(character);

  if (isChinese) {
    return 'zh';
  } else if (isLetter) {
    return 'en';
  } else {
    return 'unknown';
  }
}
