import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import UserItem, { UserItemProps, UserInfoData } from '../../component/userItem';
import ChatroomMember from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
import { AppUserInfo } from '../store/index';
import Header, { HeaderProps } from '../header';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Container/ChatroomMember',
  component: ChatroomMember,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    prefix: {
      control: 'text',
      description: 'css class name prefix',
      default: 'cui',
    },
    className: {
      control: 'text',
      description: 'css class name',
    },
    style: {
      control: 'object',
      description: 'css style',
    },
    chatroomId: {
      control: 'text',
      description: 'chatroom id',
    },
    headerProps: {
      control: 'object',
      description: 'props for Header',
      defaultValue: {
        avatar: '',
        onAvatarClick: () => {},
        moreAction: {},
        onCloseClick: () => {}, // 点击 Header 中 关闭按钮的回调
        content: 'test', // Header 中间的内容
      },
    },
    memberListProps: {
      control: 'object',
      description: 'props for member list',
      defaultValue: {
        search: true,
        placeholder: 'Search',
        renderEmpty: () => 'No data',
        renderItem: (item: AppUserInfo) => {
          return (
            <UserItem
              key={item.userId}
              data={{
                userId: item.userId,
                nickname: item.nickname,
                avatarUrl: item.avatarurl,
                description: 'owner' == item.userId ? 'owner' : '',
              }}
            />
          );
        },
        UserItemProps: {} as UserItemProps,
      },
    },
    muteListProps: {
      control: 'object',
      description: 'props for mute list',
      defaultValue: {
        search: true,
        placeholder: 'Search',
        renderEmpty: () => 'No data',
        renderItem: (item: AppUserInfo) => {
          return (
            <UserItem
              key={item.userId}
              data={{
                userId: item.userId,
                nickname: item.nickname,
                avatarUrl: item.avatarurl,
                description: 'owner' == item.userId ? 'owner' : '',
              }}
            />
          );
        },
        UserItemProps: {} as UserItemProps,
      },
    },
  },
} as Meta<typeof ChatroomMember>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

rootStore.client.user = 'zd2';
rootStore.addressStore.chatroom = [
  {
    id: '123456',
    affiliations: [{ member: 'zd1', owner: 'zd2' }],
    membersId: ['zd1', 'zd2'],
    admins: [],
    muteList: ['zd2'],
    affiliations_count: 2,
    allowinvites: false,
    created: 1629780000000,
    description: '',
    maxusers: 200,
    name: 'test',
    owner: 'zd2',
    public: true,
    custom: '',
    membersonly: false,
    mute: false,
    shieldgroup: false,
  },
];

const DefaultTemplate: StoryFn<typeof ChatroomMember> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
    >
      <ChatroomMember {...args} chatroomId="123456" />
    </Provider>
  </div>
);

const DarkTemplate: StoryFn<typeof ChatroomMember> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'dark',
      }}
    >
      <ChatroomMember {...args} chatroomId="123456" />
    </Provider>
  </div>
);

const SquareTemplate: StoryFn<typeof ChatroomMember> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        avatarShape: 'square',
        bubbleShape: 'square',
        componentsShape: 'square',
      }}
    >
      <ChatroomMember {...args} chatroomId="123456" />
    </Provider>
  </div>
);

export const Default = {
  render: DefaultTemplate,
};
export const Dark = {
  render: DarkTemplate,
};
export const Square = {
  render: SquareTemplate,
};
