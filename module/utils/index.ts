import { ChatType } from '../types/messageType';
import { ChatSDK } from '../SDK';
import rootStore, { getStore } from '../store/index';
import { GroupItem, MemberItem } from '../store/AddressStore';
import { emoji } from '../messageInput/emoji/emojiConfig';
import { AppUserInfo } from '../store/AddressStore';
import { CurrentConversation } from '../store/ConversationStore';
import type { BaseMessageType } from '../baseMessage/BaseMessage';
import { NoticeMessageBody } from '../noticeMessage/NoticeMessage';

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

export function getCvsIdFromMessage(message: BaseMessageType | NoticeMessageBody) {
  let conversationId = '';
  if (message?.type !== 'notice' && message?.type !== 'recall') {
    message = message as BaseMessageType;
    if (message.chatType == 'groupChat' || message.chatType == 'chatRoom') {
      conversationId = message.to;
    } else if (message.from == rootStore.client.user) {
      // self message
      conversationId = message.to;
    } else {
      // target message
      conversationId = message.from || '';
    }
  }
  return conversationId;
}

export function getEmojiHtml({ src = '', dataKey = '', alt = '' }) {
  return `<span><img  src=${src} data-key=${dataKey} alt=${alt} width="20" height="20" style="vertical-align: middle" /></span>`;
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

export function getUsersInfo(props: { userIdList: string[]; withPresence?: boolean }) {
  const { userIdList, withPresence = true } = props;
  let { client, addressStore, conversationStore } = getStore();
  if (!client.context) return Promise.reject('client is not initialized');
  const findIndex = userIdList.indexOf(client.user);
  let subList = [...userIdList];
  const result = {};
  if (findIndex > -1) {
    subList.splice(findIndex, 1);
  }
  if (subList.length > 0 && withPresence) {
    client.subscribePresence({ usernames: subList, expiry: 2592000 });
  }

  return new Promise((resolve, reject) => {
    const type = [
      'nickname',
      'avatarurl',
      'mail',
      'phone',
      'gender',
      'sign',
      'birth',
      'ext',
    ] as ChatSDK.ConfigurableKey[];
    const reUserInfo: Record<string, AppUserInfo> = {};
    userIdList.forEach(item => {
      reUserInfo[item] = {
        userId: item,
        isOnline: false,
      };
    });
    if (userIdList.length === 0) {
      resolve(Object.assign({}, reUserInfo));
    } else {
      client
        .fetchUserInfoById(userIdList, type)
        .then(res => {
          res.data &&
            Object.keys(res.data).forEach(item => {
              type.forEach(key => {
                reUserInfo[item][key] = res?.data?.[item][key] ? res.data[item][key] : '';
              });
            });
          if (withPresence) {
            client
              .getPresenceStatus({ usernames: userIdList })
              .then(res => {
                res?.data?.result.forEach((item: ChatSDK.SubscribePresence) => {
                  if (reUserInfo[item.uid]) {
                    reUserInfo[item.uid].presenceExt = item.ext;
                    if (
                      Object.prototype.toString.call(item.status) === '[object Object]' &&
                      Object.values(item.status).indexOf('1') > -1
                    ) {
                      reUserInfo[item.uid].isOnline = true;
                    }
                  }
                });
                conversationStore.setOnlineStatus(res.data?.result as ChatSDK.SubscribePresence[]);
                const list = addressStore.appUsersInfo;
                addressStore.setAppUserInfo(Object.assign({}, list, reUserInfo));
                resolve(Object.assign({}, result, reUserInfo));
              })
              .catch(e => {
                reject(e);
              });
          } else {
            const list = addressStore.appUsersInfo;
            addressStore.setAppUserInfo(Object.assign({}, list, reUserInfo));
            resolve(Object.assign({}, result, reUserInfo));
          }
        })
        .catch(e => {
          reject(e);
        });
    }
  });
}

export const formatHtmlString = (str: string) =>
  //@ts-ignore
  str?.replace(/[\u00A0-\u9999<>]/gim, i => ''.concat('&#', i.charCodeAt(0), ';'));

export function getGroupItemFromGroupsById(groupId: string) {
  const { addressStore } = rootStore;
  return addressStore.groups.find(item => groupId === item.groupid);
}

export function getGroupItemIndexFromGroupsById(groupId: string) {
  const { addressStore } = rootStore;
  return addressStore.groups.findIndex(item => groupId === item.groupid);
}

export function getGroupMemberIndexByUserId(group: GroupItem, userId: string) {
  return group?.members?.findIndex(item => userId === item.userId);
}

export function getGroupMemberNickName(member: MemberItem) {
  const { appUsersInfo } = rootStore.addressStore;
  return member.attributes?.nickName || appUsersInfo?.[member.userId]?.nickname || member.userId;
}

export function getAppUserInfo(userId: string) {
  const { appUsersInfo } = rootStore.addressStore;
  return appUsersInfo?.[userId] || {};
}

export function getMessages(cvs: CurrentConversation) {
  const { message } = rootStore.messageStore;
  return message[cvs.chatType][cvs.conversationId];
}

export function getMessageIndex(
  messages: (ChatSDK.MessageBody | NoticeMessageBody)[],
  messageId: string,
) {
  if (!messages) return -1;
  //@ts-ignore
  return messages.findIndex(msg => msg.id === messageId || msg.mid === messageId);
}

export function getReactionByEmoji(
  message: ChatSDK.MessageBody | NoticeMessageBody,
  emoji: string,
) {
  // @ts-ignore
  return message.reactions?.find(reaction => reaction.reaction === emoji);
}

export const getMsgSenderNickname = (msg: BaseMessageType, parentId?: string) => {
  let { chatType, from = '', to, chatThread } = msg;
  let id = parentId || chatThread?.parentId;
  if (id) {
    to = id;
  }
  const { appUsersInfo } = getStore().addressStore;
  if (chatType === 'groupChat') {
    let group = getGroupItemFromGroupsById(to);
    let memberIndex = (group && getGroupMemberIndexByUserId(group, from)) ?? -1;
    if (memberIndex > -1) {
      let memberItem = group?.members?.[memberIndex];
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
  if (a.isPinned && !b.isPinned) {
    return -1; // a排在b前面
  } else if (!a.isPinned && b.isPinned) {
    return 1; // b排在a前面
  } else if ((!a.isPinned && !b.isPinned) || (a.isPinned && b.isPinned)) {
    if (!a.lastMessage?.time) {
      return 0;
    }
    return a.lastMessage.time > b.lastMessage.time ? -1 : 1; // 保持原有顺序
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
