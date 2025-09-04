import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import GroupMember, { GroupMemberProps } from './GroupMember';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    style: 'CSS style',
    className: 'CSS class',
    prefix: 'Prefix',
    headerProps: 'Props for Header',
    onItemClick: 'Callback for item click',
    checkable: 'Whether to show checkbox',
    onCheckboxChange: 'Callback for checkbox change',
    groupMembers: 'List of group members',
    onPrivateChat: 'Callback for private chat',
    onAddContact: 'Callback for adding contact',
    onClickBack: 'Callback for back button click',
    groupId: 'Group ID',
    isOwner: 'Whether the user is the group owner',
    onUserSelect: 'Callback for user selection',
    enableMultipleSelection: 'Enable multiple selection',
    checkedUsers: 'List of checked users',
    moreAction: 'More actions for user item',
  },
  zh: {
    style: 'CSS 样式',
    className: 'CSS 类名',
    prefix: '前缀',
    headerProps: 'Header 的��性',
    onItemClick: '点击项的回调',
    checkable: '是否显示复选框',
    onCheckboxChange: '复选框变化的回调',
    groupMembers: '群组成员列表',
    onPrivateChat: '私聊的回调',
    onAddContact: '添加联系人的回调',
    onClickBack: '返回按钮点击的回调',
    groupId: '群组 ID',
    isOwner: '用户是否为群主',
    onUserSelect: '用户选择的回调',
    enableMultipleSelection: '启用多选',
    checkedUsers: '已选用户列表',
    moreAction: '用户项的更多操作',
  },
};

export default {
  title: 'Module/GroupMember',
  component: GroupMember,
  argTypes: {
    style: {
      control: 'object',
      description: description[lang].style,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    prefix: {
      control: 'text',
      description: description[lang].prefix,
    },
    headerProps: {
      control: 'object',
      description: description[lang].headerProps,
    },
    onItemClick: {
      type: 'function',
      description: description[lang].onItemClick,
    },
    checkable: {
      control: 'boolean',
      description: description[lang].checkable,
    },
    onCheckboxChange: {
      type: 'function',
      description: description[lang].onCheckboxChange,
    },
    groupMembers: {
      control: 'object',
      table: {
        type: { summary: 'Array<{ userId: string; nickname?: string }>' },
      },
      description: description[lang].groupMembers,
    },
    onPrivateChat: {
      type: 'function',
      description: description[lang].onPrivateChat,
    },
    onAddContact: {
      type: 'function',
      description: description[lang].onAddContact,
    },
    onClickBack: {
      type: 'function',
      description: description[lang].onClickBack,
    },
    groupId: {
      control: 'text',
      description: description[lang].groupId,
    },
    isOwner: {
      control: 'boolean',
      description: description[lang].isOwner,
    },
    onUserSelect: {
      type: 'function',
      description: description[lang].onUserSelect,
    },
    enableMultipleSelection: {
      control: 'boolean',
      description: description[lang].enableMultipleSelection,
    },
    checkedUsers: {
      control: 'object',
      description: description[lang].checkedUsers,
    },
    moreAction: {
      control: 'object',
      description: description[lang].moreAction,
    },
  },
} as Meta<typeof GroupMember>;

const Template: StoryFn<typeof GroupMember> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <GroupMember {...args} />
  </Provider>
);

export const Default = {
  render: Template,
  args: {
    groupMembers: [
      { userId: 'user1', nickname: 'Alice' },
      { userId: 'user2', nickname: 'Bob' },
    ],
    groupId: 'group1',
    isOwner: true,
  },
};
