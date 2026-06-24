import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { renderTxt } from '../textMessage/TextMessage';
import ChatroomMessage from './index';
import Provider from '../store/Provider';
import { ChatroomMessageProps } from './ChatroomMessage';
import type { ChatSDK } from '../SDK';
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    chatroomMessage: 'Chatroom message component',
    prefix: 'Prefix',
    className: 'Class name',
    style: 'Style',
    message: 'The message object',
    targetLanguage: 'The target language of translation',
    actionConfig:
      'Action config, example: { recall: true, translate: true, mute: true, pin: true, customActions: [{ icon: <Icon type="COPY" width={16} height={16} />, content: "Custom menu item", onClick: () => {}, visible: true }] }',
  },
  zh: {
    chatroomMessage: '聊天室消息组件',
    prefix: '组件类名前缀',
    className: '组件类名',
    style: '组件样式',
    message: '消息对象',
    targetLanguage: '翻译的目标语言',
    actionConfig:
      '操作菜单配置, 示例：{ recall: true, translate: true, mute: true, pin: true, customActions: [{ icon: <Icon type="COPY" width={16} height={16} />, content: "自定义菜单项", onClick: () => {}, visible: true }] }',
  },
};

export default {
  title: 'Module/ChatroomMessage',
  component: ChatroomMessage,
  argTypes: {
    prefix: {
      control: 'text',
      type: 'string',
      description: description[lang].prefix,
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
    message: {
      control: 'object',
      description: description[lang].message,
    },
    targetLanguage: {
      control: 'text',
      description: description[lang].targetLanguage,
    },
    actionConfig: {
      control: 'object',
      description: description[lang].actionConfig,
    },
  },
} as Meta<typeof ChatroomMessage>;

const Template: StoryFn<ChatroomMessageProps> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <ChatroomMessage {...args} />
  </Provider>
);

export const textMessage = {
  render: Template,
  args: {
    message: {
      msgLocalId: 'chatroom-text-local-1',
      msgServerId: '1234567890',
      type: 'text',
      body: { content: 'hello' },
      to: 'chatroomId',
      conversationId: 'chatroomId',
      conversationType: 'chatRoom',
      // bySelf: true,
      from: 'Leo',
      sender: { userId: 'Leo' },
      timestamp: Date.now(),
      direct: 'RECEIVE',
      // status: 'sent',
      status: 'sent',
    } as ChatSDK.Message,
  },
};

export const giftMessage = {
  render: Template,
  args: {
    message: {
      msgLocalId: 'chatroom-custom-local-1',
      msgServerId: '1231026004235920980',
      type: 'custom',
      conversationType: 'chatRoom',
      conversationId: '230164666580997',
      from: 'pev4pyzbwnutbp7a',
      to: '230164666580997',
      sender: { userId: 'pev4pyzbwnutbp7a' },
      body: {
        event: 'CHATROOMUIKITGIFT',
        params: {
          chatroom_uikit_gift:
            '{"giftId":"2665752a-e273-427c-ac5a-4b2a9c82b255","giftIcon":"https://fullapp.oss-cn-beijing.aliyuncs.com/uikit/pictures/gift/AUIKitGift1.png","giftName":"Heart","giftPrice":"1"}',
        },
      },
      ext: {
        chatroom_uikit_userInfo: {
          userId: 'pev4pyzbwnutbp7a',
          nickname: 'Leo',
          avatarURL:
            'https://a1.easemob.com/easemob/chatroom-uikit/chatfiles/a27bd9a0-79f8-11ee-8f83-551faec94303',
          gender: 1,
        },
      },
      timestamp: 1704185376943,
      onlineState: 1,
      direct: 'RECEIVE',
      status: 'sent',
      priority: 'normal',
      broadcast: false,
      // bySelf: false,
    } as ChatSDK.Message,
  },
};
