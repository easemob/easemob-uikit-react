import { ChatType } from '../types/messageType';
import { AgoraChat } from 'agora-chat';
import rootStore from '../store/index';
import type { RecallMessage } from '../store/MessageStore';
import { GroupItem, MemberItem } from '../store/AddressStore';
import { emoji } from '../messageEditor/emoji/emojiConfig';

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

export function getCvsIdFromMessage(message: AgoraChat.MessageBody | RecallMessage) {
  let conversationId = '';
  if (message.chatType == 'groupChat') {
    conversationId = message.to;
  } else if (message.from == rootStore.client.user) {
    // self message
    conversationId = message.to;
  } else {
    // target message
    conversationId = message.from || '';
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
  return member.attributes?.nickName || member.userId;
}
