import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import rootStore from '../store';
import { TextMessage } from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
import Provider from '../store/Provider';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    textMessage: 'textMessage',
    type: 'type',
    prefix: 'prefix',
    className: 'className',
    bubbleClass: 'bubbleClass',
    children: 'children',
    style: 'style',
    onCreateThread: 'Callback when creating a thread',
    onTranslateTextMessage: 'Callback when translating text message',
    targetLanguage: 'The target language to be translated into',
    showTranslation: 'Whether to show the translated message',
    onlyContent: 'Whether to only display the content',
    onOpenThreadPanel: 'Callback when opening the thread panel',
    showEditedTag: 'Whether to show the edited tag',
  },
  zh: {
    textMessage: '文本消息',
    type: '类型',
    prefix: '前缀',
    className: '类名',
    bubbleClass: '气泡类名',
    children: '子元素',
    style: '样式',
    onCreateThread: '创建线程',
    onTranslateTextMessage: '翻译文本消息',
    targetLanguage: '目标语言',
    showTranslation: '是否展示翻译后的消息',
    onlyContent: '是否只展示内容',
    onOpenThreadPanel: '打开线程面板',
    showEditedTag: '是否展示编辑标签',
  },
};
export default {
  title: 'Module/TextMessage',
  component: TextMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    prefix: {
      description: description[lang].prefix,
      control: {
        type: 'text',
      },
    },
    className: {
      description: description[lang].className,
      control: {
        type: 'text',
      },
    },
    bubbleClass: {
      description: description[lang].bubbleClass,
      control: {
        type: 'text',
      },
    },
    children: {
      description: description[lang].children,
    },
    style: {
      description: description[lang].style,
      control: {
        type: 'object',
      },
    },
    textMessage: {
      description: description[lang].textMessage,
      control: {
        type: 'object',
      },
      table: {
        type: { summary: 'TextMessageType' },
        defaultValue: { summary: 'TextMessageType' },
      },
    },
    showTranslation: {
      description: description[lang].showTranslation,
      control: {
        type: 'boolean',
      },
    },
    targetLanguage: {
      description: description[lang].targetLanguage,
      control: {
        type: 'text',
      },
    },
    type: {
      description: description[lang].type,
      control: {
        type: 'select',
        options: ['primary', 'secondly'],
      },
    },
    onCreateThread: {
      description: description[lang].onCreateThread,
    },
    onlyContent: {
      description: description[lang].onlyContent,
      control: {
        type: 'boolean',
      },
    },
    onOpenThreadPanel: {
      description: description[lang].onOpenThreadPanel,
    },
    showEditedTag: {
      description: description[lang].showEditedTag,
      control: {
        type: 'boolean',
      },
    },
  },
} as Meta<typeof TextMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof TextMessage> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <TextMessage {...args} />
  </Provider>
);

export const Primary = {
  render: Template,

  args: {
    textMessage: {
      type: 'txt',
      msg: 'hello',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: true,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
      modifiedInfo: {
        operatorId: '',
        operationCount: 0,
        operationTime: 0,
      },
    },
  },
};

export const TextMessageWithReply = {
  render: Template,

  args: {
    textMessage: {
      id: '1189528432543795984',
      type: 'txt',
      chatType: 'singleChat',
      msg: 'asd',
      to: 'zd4',
      from: 'zd2',
      ext: {
        em_at_list: [],
        msgQuote: {
          msgID: '1187658028808145668',
          msgPreview: 'Start a video call',
          msgSender: 'zd4',
          msgType: 'txt',
        },
      },
      time: 1694523470608,
      onlineState: 3,
      status: 'sent',
      modifiedInfo: {
        operatorId: '',
        operationCount: 0,
        operationTime: 0,
      },
      bySelf: false,
    },
  },
};
