import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import FileMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { ICON_TYPES } from '../../component/icon/const';
import { FileObj } from '../types/messageType';
// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    fileMessage: 'File message object',
    type: 'Type of message',
    filename: 'Name of the file',
    file_length: 'Length of the file',
    url: 'URL of the file',
    id: 'Unique identifier',
    to: 'Recipient ID',
    chatType: 'Type of chat',
    bySelf: 'Sent by self',
    from: 'Sender ID',
    time: 'Timestamp',
    status: 'Status of the message',
    iconType: 'Icon type',
    prefix: 'Prefix',
    className: 'CSS class',
    style: 'CSS style',
    bubbleClass: 'Bubble class',
    thread: 'Thread',
  },
  zh: {
    fileMessage: '文件消息对象',
    type: '消息类型',
    filename: '文件名',
    file_length: '文件长度',
    url: '文件的URL',
    id: '唯一标识符',
    to: '接收者ID',
    chatType: '聊天类型',
    bySelf: '是否自己发送',
    from: '发送者ID',
    time: '时间戳',
    status: '消息状态',
    iconType: '文件图标类型',
    prefix: '前缀',
    className: 'CSS 类名',
    style: 'CSS 样式',
    bubbleClass: '气泡样式',
    thread: '是否是线程',
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/FileMessage',
  component: FileMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    fileMessage: {
      control: 'object',
      description: description[lang].fileMessage,
    },
    iconType: {
      control: 'select',
      options: Object.keys(ICON_TYPES),
      description: description[lang].iconType,
    },
    prefix: {
      control: 'text',
      description: description[lang].prefix,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    bubbleClass: {
      control: 'text',
      description: description[lang].bubbleClass,
    },
    thread: {
      control: 'boolean',
      description: description[lang].thread,
    },
  },
} as Meta<typeof FileMessage>;

export const Primary = {
  args: {
    fileMessage: {
      type: 'file',
      filename: 'test.txt',
      file_length: 1024,
      file: {
        url: 'http:example.com',
        filename: 'test.txt',
        filetype: 'txt',
        data: {} as File,
      },
      url: 'http:example.com',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: true,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
    },
  },
};

export const Secondly = {
  args: {
    type: 'secondly',
    direction: 'ltr',
    fileMessage: {
      type: 'file',
      filename: 'test.txt',
      file_length: 1024,
      file: {
        url: 'http:example.com',
        filename: 'test.txt',
        filetype: 'txt',
        data: {} as File,
      },
      url: 'http:example.com',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: false,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
    },
  },
};
