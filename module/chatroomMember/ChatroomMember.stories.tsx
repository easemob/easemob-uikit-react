import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import UserItem, { UserItemProps, UserInfoData } from '../../component/userItem';
import ChatroomMember from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
import { AppUserInfo } from '../store/index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    chatroomMember:
      'ChatroomMember component is a container component that encapsulates the chatroom member function. It is mainly used to display the member list of a chatroom and support search and mute list operations. It is suitable for scenarios such as displaying member lists, searching for members, and muting members in a chatroom.',
    prefix: 'Prefix',
    className: 'Class name',
    style: 'Style',
    chatroomId: 'Chatroom id',
    headerProps: 'props for Header',
    memberListProps: 'props for member list',
    muteListProps: 'props for mute list',
    memberListProps_search: 'Whether to display the search box',
    memberListProps_placeholder: 'Search box placeholder',
    memberListProps_renderEmpty:
      'The content displayed when rendering an empty list, return value is ReactNode',
    memberListProps_renderItem:
      'Render the content of each item, parameter is AppUserInfo, return value is ReactNode',
    memberListProps_UserItemProps: 'UserItem props',
  },
  zh: {
    chatroomMember: '聊天室成员组件用来展示聊天室成员列表，支持搜索，聊天室owner支持禁言列表。',
    prefix: '组件类名前缀',
    className: '组件类名',
    style: '组件样式',
    chatroomId: '聊天室 id',
    headerProps: 'Header 组件的参数',
    memberListProps: '成员列表的参数',
    muteListProps: '禁言列表的参数',
    memberListProps_search: '是否显示搜索框',
    memberListProps_placeholder: '搜索框的 placeholder',
    memberListProps_renderEmpty: '没有数据时显示的内容， 返回值为 ReactNode',
    memberListProps_renderItem: '渲染每一项的内容， 参数为 AppUserInfo， 返回值为 ReactNode',
    memberListProps_UserItemProps: 'UserItem 的参数',
  },
};
export default {
  title: 'Container/ChatroomMember',
  component: ChatroomMember,
  parameters: {
    docs: {
      description: {
        component: description[lang].chatroomMember,
      },
    },
  },
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
      type: 'string',
    },
    className: {
      control: 'text',
      type: 'string',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    chatroomId: {
      control: 'text',
      type: 'string',
      description: description[lang].chatroomId,
    },
    headerProps: {
      control: 'object',
      description: description[lang].headerProps,
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
      description: description[lang].memberListProps,
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
      table: {
        type: {
          summary: 'object',
          detail: `{
  search?: boolean; // ${description[lang].memberListProps_search}
  placeholder?: string; // ${description[lang].memberListProps_placeholder}
  renderEmpty?: () => ReactNode; // ${description[lang].memberListProps_renderEmpty}
  renderItem?: (item: AppUserInfo) => ReactNode; // ${description[lang].memberListProps_renderItem}
  UserItemProps?: UserItemProps; // ${description[lang].memberListProps_UserItemProps}
}`,
        },
      },
    },
    muteListProps: {
      control: 'object',
      description: description[lang].muteListProps,
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
      table: {
        type: {
          summary: 'object',
          detail: `{
  search?: boolean; // ${description[lang].memberListProps_search}
  placeholder?: string; // ${description[lang].memberListProps_placeholder}
  renderEmpty?: () => ReactNode; // ${description[lang].memberListProps_renderEmpty}
  renderItem?: (item: AppUserInfo) => ReactNode; // ${description[lang].memberListProps_renderItem}
  UserItemProps?: UserItemProps; // ${description[lang].memberListProps_UserItemProps}
}`,
        },
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
