import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { renderTxt } from '../textMessage/TextMessage';
import ChatroomMessage from './index';
import Provider from '../store/Provider';
import { ChatroomMessageProps } from './ChatroomMessage';
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    chatroomMessage: 'Chatroom message component',
    prefix: 'Prefix',
    className: 'Class name',
    style: 'Style',
    message: 'The message object',
    targetLanguage: 'The target language of translation',
    onReport:
      'The callback function for reporting, the parameter is the message object, you need to implement the pop-up report dialog by yourself',
    actionConfig:
      'Action config, example: { recall: true, translate: true, report: false, mute: true, pin: true, customActions: [{ icon: <Icon type="COPY" width={16} height={16} />, content: "Custom menu item", onClick: () => {}, visible: true }] }',
  },
  zh: {
    chatroomMessage: '聊天室消息组件',
    prefix: '组件类名前缀',
    className: '组件类名',
    style: '组件样式',
    message: '消息对象',
    targetLanguage: '翻译的目标语言',
    onReport: '举报的回调函数, 参数为消息对象, 需要自己实现弹出举报的弹框',
    actionConfig:
      '操作菜单配置, 示例：{ recall: true, translate: true, report: false, mute: true, pin: true, customActions: [{ icon: <Icon type="COPY" width={16} height={16} />, content: "自定义菜单项", onClick: () => {}, visible: true }] }',
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
    onReport: {
      action: 'report',
      description: description[lang].onReport,
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
      type: 'txt',
      msg: 'hello',
      id: '1234567890',
      to: 'chatroomId',
      chatType: 'chatRoom',
      // bySelf: true,
      from: 'Leo',
      time: Date.now(),
      // status: 'sent',
    },
  },
};

export const giftMessage = {
  render: Template,
  args: {
    message: {
      id: '1231026004235920980',
      type: 'custom',
      chatType: 'chatRoom',
      from: 'pev4pyzbwnutbp7a',
      to: '230164666580997',
      customEvent: 'CHATROOMUIKITGIFT',
      params: {},
      customExts: {
        chatroom_uikit_gift:
          '{"giftId":"2665752a-e273-427c-ac5a-4b2a9c82b255","giftIcon":"https://fullapp.oss-cn-beijing.aliyuncs.com/uikit/pictures/gift/AUIKitGift1.png","giftName":"Heart","giftPrice":"1"}',
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
      time: 1704185376943,
      onlineState: 1,
      priority: 'normal',
      broadcast: false,
      // bySelf: false,
    },
  },
};
