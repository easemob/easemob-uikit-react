import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import { GroupDetail } from './index';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    prefix: 'Prefix',
    className: 'CSS class',
    style: 'CSS style',
    conversation: 'Conversation',
    onUserIdCopied: 'On user id copied',
    onLeaveGroup: 'On leave group',
    onDestroyGroup: 'On destroy group',
    groupMemberProps: 'GroupMember component props',
    onGroupMemberVisibleChange: 'Callback of GroupMember visible change',
  },
  zh: {
    prefix: '前缀',
    className: 'CSS 类名',
    style: 'CSS 样式',
    conversation: '会话',
    onUserIdCopied: '用户 ID 复制',
    onLeaveGroup: '离开群组',
    onDestroyGroup: '销毁群组',
    groupMemberProps: 'GroupMember 组件属性',
    onGroupMemberVisibleChange: 'GroupMember 可见性变化的回调',
  },
};

export default {
  title: 'Module/GroupDetail',
  component: GroupDetail,
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
      default: 'cui',
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    conversation: {
      control: 'object',
      description: description[lang].conversation,
    },
    onUserIdCopied: {
      type: 'function',
      description: description[lang].onUserIdCopied,
    },
    onLeaveGroup: {
      type: 'function',
      description: description[lang].onLeaveGroup,
    },
    onDestroyGroup: {
      type: 'function',
      description: description[lang].onDestroyGroup,
    },
    groupMemberProps: {
      control: 'object',
      description: description[lang].groupMemberProps,
    },
    onGroupMemberVisibleChange: {
      type: 'function',
      description: description[lang].onGroupMemberVisibleChange,
    },
  },
} as Meta<typeof GroupDetail>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

const Template: StoryFn<typeof GroupDetail> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <GroupDetail {...args} />
  </Provider>
);

const DarkTemplate: StoryFn<typeof GroupDetail> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
    theme={{
      mode: 'dark',
    }}
  >
    <GroupDetail {...args} />
  </Provider>
);

export const Default = {
  render: Template,

  args: {
    conversation: {
      conversationId: '236518002196485',
      chatType: 'groupChat',
    },
  },
};

export const Dark = {
  render: DarkTemplate,

  args: {
    conversation: {
      conversationId: '236518002196485',
      chatType: 'groupChat',
    },
  },
};
