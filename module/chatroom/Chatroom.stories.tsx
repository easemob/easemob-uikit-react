import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Chatroom from './index';
import rootStore from '../store';
import Provider from '../store/Provider';

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
  },
} as Meta<typeof Chatroom>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

rootStore.conversationStore.setCurrentCvs({
  chatType: 'singleChat',
  conversationId: 'zd2',
  name: 'Henry',
});

const DefaultTemplate: StoryFn<typeof Chatroom> = args => (
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

const DarkTemplate: StoryFn<typeof Chatroom> = args => (
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

const SquareTemplate: StoryFn<typeof Chatroom> = args => (
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
