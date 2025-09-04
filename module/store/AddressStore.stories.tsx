import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { AddressStore, GroupItem } from './AddressStore'; // 假设这是一个导出的类或对象
import rootStore from '../store';
import Provider from '../store/Provider';
// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    appUsersInfo: 'appUsersInfo',
    setContacts: 'setContacts',
    setAppUserInfo: 'setAppUserInfo',
    groups: 'Groups information',
    setGroups: 'Set groups information',
    chatroom: 'Chatroom information',
    searchList: 'Search list',
    thread: 'Thread information',
    requests: 'Request information',
    blockList: 'Blacklist information',
    deleteContact: 'Delete contact',
    setGroupMembers: 'Set group members',
    muteChatRoomMember: 'Mute chat room member',
    unmuteChatRoomMember: 'Unmute chat room member',
    getChatroomMuteList: 'Get chat room mute list',
    setChatroom: 'Set chat room',
    createGroup: 'Create group',
    modifyGroup: 'Modify group',
    destroyGroup: 'Destroy group',
    leaveGroup: 'Leave group',
    inviteToGroup: 'Invite user to group',
    changeGroupOwner: 'Change group owner',
    removeGroupMembers: 'Remove group members',
    addContact: 'Add contact',
    acceptContactInvite: 'Accept contact invite',
    getBlockList: 'Get block list',
    addUsersToBlocklist: 'Add users to block list',
    removeUserFromBlocklist: 'Remove user from block list',
    publishPresence: 'Publish user status',
    AddressStore:
      'AddressStore is a store that contains user information, group information, chatroom information, thread information, request information, blacklist information, and methods to manage these data.',
  },
  zh: {
    appUsersInfo: '用户信息',
    setContacts: '设置联系人',
    setAppUserInfo: '设置用户信息',
    groups: '群组信息',
    setGroups: '设置群组信息',
    chatroom: '聊天室信息',
    searchList: '搜索列表',
    thread: '线程信息',
    requests: '请求信息',
    blockList: '黑名单信息',
    deleteContact: '删除联系人',
    setGroupMembers: '设置群组成员',
    muteChatRoomMember: '禁言聊天室成员',
    unmuteChatRoomMember: '解除聊天室成员禁言',
    getChatroomMuteList: '获取聊天室禁言列表',
    setChatroom: '设置聊天室',
    createGroup: '创建群组',
    modifyGroup: '修改群组',
    destroyGroup: '解散群组',
    leaveGroup: '离开群组',
    inviteToGroup: '邀请用户加入群组',
    changeGroupOwner: '修改群组所有者',
    removeGroupMembers: '移除群组成员',
    addContact: '添加联系人',
    acceptContactInvite: '接受联系人邀请',
    getBlockList: '获取黑名单',
    addUsersToBlocklist: '添加用户到黑名单',
    removeUserFromBlocklist: '移除用户从黑名单',
    publishPresence: '发布用户状态',
    AddressStore:
      'AddressStore 是一个数据仓库，包含用户信息，群组信息，聊天室信息，线程信息，请求信息，黑名单信息，以及管理这些数据的方法。',
  },
};

// 假设我们有一个简单的组件来展示AddressStore的内容
const AddressStoreComponent = () => {
  return (
    <div>
      <Provider
        initConfig={{
          appKey: 'a#b',
        }}
      >
        <div>{description[lang].AddressStore}</div>
      </Provider>
    </div>
  );
};

export default {
  title: 'Store/AddressStore',
  component: AddressStoreComponent,
  argTypes: {
    appUsersInfo: {
      control: 'object',
      description: description[lang].appUsersInfo,
      table: {
        type: {
          summary: 'object',
          detail:
            '{[userId: string]: {userId: string, isOnline: boolean, presenceExt: string, nickname: string, silent?: boolean,remark?: string}}',
        },
        defaultValue: {
          summary: '{}',
        },
      },
    },
    groups: {
      control: 'object',
      description: description[lang].groups,
      table: {
        type: {
          summary: 'array',
          detail: 'GroupItem[]',
        },
        defaultValue: {
          summary: '[]',
        },
      },
    },
    chatroom: {
      control: 'object',
      description: description[lang].chatroom,
      table: {
        type: { summary: 'array', detail: 'ChatroomInfo[]' },
        defaultValue: { summary: '[]' },
      },
    },
    thread: {
      control: 'object',
      description: description[lang].thread,
      table: {
        type: { summary: 'object', detail: '{[key: string]: ChatSDK.ThreadChangeInfo[]}' },
        defaultValue: { summary: '{}' },
      },
    },
    requests: {
      control: 'object',
      description: description[lang].requests,
      table: {
        type: { summary: 'array', detail: 'ContactRequest[]' },
        defaultValue: { summary: '[]' },
      },
    },
    blockList: {
      control: 'object',
      description: description[lang].blockList,
      table: {
        type: { summary: 'array', detail: 'string[]' },
        defaultValue: { summary: '[]' },
      },
    },
    setContacts: {
      description: description[lang].setContacts,
      table: {
        type: {
          summary: 'function',
          detail:
            '(contacts: {userId: string, nickname: string, silent?: boolean, remark?: string}[]) => void',
        },
      },
      control: 'function',
    },
    deleteContact: {
      description: description[lang].deleteContact,
      table: {
        type: { summary: 'function', detail: '(userId: string) => void' },
      },
      control: 'function',
    },

    setAppUserInfo: {
      description: description[lang].setAppUserInfo,
      table: {
        type: {
          summary: 'function',
          detail: '(appUsersInfo: Record<string, AppUserInfo>) => void',
        },
      },
      control: 'function',
    },

    setGroups: {
      description: description[lang].setGroups,
      table: {
        type: { summary: 'function', detail: '(groups: GroupItem[]) => void' },
      },
      control: 'function',
    },
    setGroupMembers: {
      description: description[lang].setGroupMembers,
      table: {
        type: {
          summary: 'function',
          detail: '(groupId: string, members: {member: string}[]) => void',
        },
      },
      control: 'function',
    },
    muteChatRoomMember: {
      description: description[lang].muteChatRoomMember,
      table: {
        type: {
          summary: 'function',
          detail: '(chatroomId: string, userId: string, muteDuration?: number) => void',
        },
      },
      control: 'function',
    },
    unmuteChatRoomMember: {
      description: description[lang].unmuteChatRoomMember,
      table: {
        type: { summary: 'function', detail: '(chatroomId: string, userId: string) => void' },
      },
      control: 'function',
    },
    getChatroomMuteList: {
      description: description[lang].getChatroomMuteList,
      table: {
        type: { summary: 'function', detail: '(chatroomId: string) => void' },
      },
      control: 'function',
    },
    setChatroom: {
      description: description[lang].setChatroom,
      table: {
        type: { summary: 'function', detail: '(chatroom: ChatroomInfo[]) => void' },
      },
      control: 'function',
    },
    createGroup: {
      description: description[lang].createGroup,
      table: {
        type: { summary: 'function', detail: '(members: string[]) => void' },
      },
      control: 'function',
    },
    modifyGroup: {
      description: description[lang].modifyGroup,
      table: {
        type: {
          summary: 'function',
          detail: '(groupId: string, groupName: string, description: string) => void',
        },
      },
      control: 'function',
    },
    destroyGroup: {
      description: description[lang].destroyGroup,
      table: {
        type: { summary: 'function', detail: '(groupId: string) => void' },
      },
      control: 'function',
    },
    leaveGroup: {
      description: description[lang].leaveGroup,
      table: {
        type: { summary: 'function', detail: '(groupId: string) => void' },
      },
      control: 'function',
    },
    inviteToGroup: {
      description: description[lang].inviteToGroup,
      table: {
        type: { summary: 'function', detail: '(groupId: string, userIds: string[]) => void' },
      },
      control: 'function',
    },
    changeGroupOwner: {
      description: description[lang].changeGroupOwner,
      table: {
        type: { summary: 'function', detail: '(groupId: string, userId: string) => void' },
      },
      control: 'function',
    },
    removeGroupMembers: {
      description: description[lang].removeGroupMembers,
      table: {
        type: { summary: 'function', detail: '(groupId: string, userIds: string[]) => void' },
      },
      control: 'function',
    },
    addContact: {
      description: description[lang].addContact,
      table: {
        type: { summary: 'function', detail: '(userId: string) => void' },
      },
      control: 'function',
    },
    acceptContactInvite: {
      description: description[lang].acceptContactInvite,
      table: {
        type: { summary: 'function', detail: '(userId: string) => void' },
      },
      control: 'function',
    },
    getBlockList: {
      description: description[lang].getBlockList,
      table: {
        type: { summary: 'function', detail: '() => void' },
      },
      control: 'function',
    },
    addUsersToBlocklist: {
      description: description[lang].addUsersToBlocklist,
      table: {
        type: { summary: 'function', detail: '(userIdList: string[]) => void' },
      },
      control: 'function',
    },
    removeUserFromBlocklist: {
      description: description[lang].removeUserFromBlocklist,
      table: {
        type: { summary: 'function', detail: '(userIdList: string[]) => void' },
      },
      control: 'function',
    },

    publishPresence: {
      description: description[lang].publishPresence,
      table: {
        type: { summary: 'function', detail: '(userId: string, presenceExt: string) => void' },
      },
      control: 'function',
    },
  },
} as Meta<typeof AddressStoreComponent>;

const Template: StoryFn<typeof AddressStoreComponent> = args => <AddressStoreComponent />;

export const Default = {
  render: Template,
  args: {
    // 根据实际的AddressStore属性和方法设置默认参数
  },
};
