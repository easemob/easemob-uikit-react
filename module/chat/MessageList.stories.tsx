import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { MsgListProps, MessageList } from './MessageList';
import rootStore from '../store';
import Provider from '../store/Provider';
import { HeaderProps } from '../header';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    messageList:
      'MessageList component is a container component that encapsulates the message list function. It is mainly used to display the message list, support search, sort, delete, pin, mute, and customize the message item. ',
    prefix: 'Prefix',
    style: 'Style',
    className: 'Class name',
    renderMessage: 'Render message, deprecated, use customRenderers instead',
    renderUserProfile: 'Render user profile',
    conversation: 'Conversation',
    messageProps: 'Message props',
    isThread: 'Is thread',
    customRenderers:
      'Custom renderers, example: { txt: ctx => <TextMessage textMessage={ctx.message} /> }',
    onOpenThreadPanel: 'On open thread panel callback',
    onRtcInviteMessageClick: 'On rtc invite message click callback',
  },
  zh: {
    messageList:
      'MessageList 组件是一个容器组件，封装了消息列表功能。主要用于显示消息列表，支持搜索，排序，删除，置顶，静音，自定义消息项。',
    prefix: '组件类名前缀',
    style: '组件样式',
    className: '组件类名',
    renderMessage: '渲染消息，deprecated，使用 customRenderers 替代',
    renderUserProfile: '渲染用户资料',
    conversation: '会话',
    messageProps: '消息 props',
    isThread: '是否是子区',
    customRenderers:
      '按消息类型自定义渲染器，示例：{ txt: ctx => <TextMessage textMessage={ctx.message} /> }',
    onOpenThreadPanel: '打开子区面板回调',
    onRtcInviteMessageClick: '点击rtc邀请消息回调',
  },
};

export default {
  title: 'Container/MessageList',
  component: MessageList,
  parameters: {
    docs: {
      description: {
        component: description[lang].messageList,
      },
    },
  },
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
      default: 'cui',
      type: 'string',
    },
    className: {
      control: 'text',
      description: description[lang].className,
      type: 'string',
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    isThread: {
      control: 'boolean',
      description: description[lang].isThread,
    },
    renderMessage: {
      type: 'function',
      description: description[lang].renderMessage,
    },
    customRenderers: {
      control: 'object',
      description: description[lang].customRenderers,
    },
    renderUserProfile: {
      type: 'function',
      description: description[lang].renderUserProfile,
    },
    conversation: {
      control: 'object',
      description: description[lang].conversation,
    },
    messageProps: {
      control: 'object',
      description: description[lang].messageProps,
    },
    onOpenThreadPanel: {
      type: 'function',
      description: description[lang].onOpenThreadPanel,
    },
    onRtcInviteMessageClick: {
      type: 'function',
      description: description[lang].onRtcInviteMessageClick,
    },
  },
};

const DefaultTemplate: StoryFn<MsgListProps> = args => {
  return (
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
    >
      <MessageList {...args} />
    </Provider>
  );
};

const DarkTemplate: StoryFn<MsgListProps> = args => {
  return (
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'dark',
      }}
    >
      <MessageList {...args} />
    </Provider>
  );
};
export const Default = {
  render: DefaultTemplate,
};

export const Dark = {
  render: DarkTemplate,
};

const SquareTemplate: StoryFn<MsgListProps> = args => {
  return (
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
      <MessageList {...args} />
    </Provider>
  );
};
export const Square = {
  render: SquareTemplate,
};
