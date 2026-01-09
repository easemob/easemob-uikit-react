import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Chatroom from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
import { ChatroomProps } from './Chatroom';
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    chatroom:
      'Chatroom component is a container component that encapsulates the chatroom function. It is mainly used to display chatroom messages and send messages. It is suitable for scenarios such as text, emoji, gift messages, and is designed to meet the needs of most users in the entertainment scene. ',
    prefix: 'Prefix',
    className: 'Class name',
    style: 'Style',
    chatroomId: 'Chatroom id',
    reportType: 'Customize report content, such as {"reportType": "report reason"}',
    headerProps: 'props for Header',
    messageListProps: 'props for MessageList',
    messageInputProps: 'props for MessageInput',
    broadcastProps: 'props for Broadcast',
    renderHeader: 'Render header',
    renderMessageList: 'Render message list',
    renderMessageInput: 'Render message input',
    renderBroadcast: 'Render broadcast',
    renderEmpty: 'Render empty',
    messageActionConfig:
      'Message action config, example: { recall: true, translate: true, report: false, mute: true, pin: true, customActions: [{ icon: <Icon type="COPY" width={16} height={16} />, content: "Custom menu item", onClick: () => {}, visible: true }] }',
    customMessageRenderers:
      'Custom message renderers, example: { txt: ctx => <ChatroomMessage message={ctx.message} /> }',
    showUnreadCount: 'Show unread count, default is false when message list is not at the bottom',
  },
  zh: {
    chatroom: '聊天室组件包含了文本，表情，礼物消息，旨在满足大多数用户对泛娱乐场景的聊天室需求。',
    prefix: '组件类名前缀',
    className: '组件类名',
    style: '组件样式',
    chatroomId: '聊天室 id',
    reportType: '自定义举报内容, 如 {"reportType": "举报原因"}',
    headerProps: 'Header 组件的参数',
    messageListProps: 'MessageList 组件的参数',
    messageInputProps: 'MessageInput 组件的参数',
    broadcastProps: 'Broadcast 组件的参数',
    renderHeader: '渲染头部',
    renderMessageList: '渲染消息列表',
    renderMessageInput: '渲染消息输入框',
    renderBroadcast: '渲染广播',
    renderEmpty: '渲染空',
    messageActionConfig:
      '消息操作菜单配置, 示例：{ recall: true, translate: true, report: false, mute: true, pin: true, customActions: [{ icon: <Icon type="COPY" width={16} height={16} />, content: "自定义菜单项", onClick: () => {}, visible: true }] }',
    customMessageRenderers:
      '自定义消息渲染器，示例：{ txt: ctx => <ChatroomMessage message={ctx.message} /> }',
    showUnreadCount: '消息列表不在最下面时，是否显示未读数, 默认不显示',
  },
};

export default {
  title: 'Container/Chatroom',
  component: Chatroom,
  parameters: {
    docs: {
      description: {
        component: description[lang].chatroom,
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
      description: description[lang].className,
      type: 'string',
    },
    style: {
      control: 'object',
      description: 'css style',
    },
    chatroomId: {
      control: 'text',
      description: description[lang].chatroomId,
      type: 'string',
    },
    reportType: {
      control: 'object',
      description: description[lang].reportType,
    },
    headerProps: {
      control: 'object',
      description: description[lang].headerProps,
    },
    messageListProps: {
      control: 'object',
      description: description[lang].messageListProps,
    },
    messageInputProps: {
      control: 'object',
      description: description[lang].messageInputProps,
    },
    broadcastProps: {
      control: 'object',
      description: description[lang].broadcastProps,
    },
    renderHeader: {
      type: 'function',
      description: description[lang].renderHeader,
    },
    renderMessageList: {
      type: 'function',
      description: description[lang].renderMessageList,
    },
    renderMessageInput: {
      type: 'function',
      description: description[lang].renderMessageInput,
    },
    renderBroadcast: {
      type: 'function',
      description: description[lang].renderBroadcast,
    },
    renderEmpty: {
      type: 'function',
      description: description[lang].renderEmpty,
    },
    messageActionConfig: {
      control: 'object',
      description: description[lang].messageActionConfig,
    },
    customMessageRenderers: {
      control: 'object',
      description: description[lang].customMessageRenderers,
    },
    showUnreadCount: {
      control: 'boolean',
      description: description[lang].showUnreadCount,
      type: 'boolean',
      default: false,
    },
  },
} as Meta<typeof Chatroom>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

rootStore.conversationStore.setCurrentCvs({
  chatType: 'singleChat',
  conversationId: 'zd2',
  name: 'Henry',
});

const DefaultTemplate: StoryFn<ChatroomProps> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
    >
      <Chatroom {...args} />
    </Provider>
  </div>
);

const DarkTemplate: StoryFn<ChatroomProps> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'dark',
      }}
    >
      <Chatroom {...args} />
    </Provider>
  </div>
);

const SquareTemplate: StoryFn<ChatroomProps> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'light',
        avatarShape: 'square',
        bubbleShape: 'square',
        componentsShape: 'square',
      }}
    >
      <Chatroom {...args} />
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
