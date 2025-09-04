import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import ImageMessage from './index';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    imageMessage: 'Image message object',
    type: 'Type of message',
    file_length: 'Length of the file',
    file: 'File object',
    url: 'URL of the image',
    id: 'Unique identifier',
    to: 'Recipient ID',
    chatType: 'Type of chat',
    bySelf: 'Sent by self',
    from: 'Sender ID',
    time: 'Timestamp',
    status: 'Status of the message',
    prefix: 'Prefix for CSS classes',
    style: 'CSS style',
    className: 'CSS class name',
    bubbleClass: 'Bubble CSS class name',
    onClickImage: 'Callback for image click',
    imgProps: 'Additional image properties',
  },
  zh: {
    imageMessage: '图片消息对象',
    type: '消息类型',
    file_length: '文件长度',
    file: '文件对象',
    url: '图片的URL',
    id: '唯一标识符',
    to: '接收者ID',
    chatType: '聊天类型',
    bySelf: '是否自己发送',
    from: '发送者ID',
    time: '时间戳',
    status: '消息状态',
    prefix: 'CSS 类名前缀',
    style: 'CSS 样式',
    className: 'CSS 类名',
    bubbleClass: '气泡 CSS 类名',
    onClickImage: '图片点击的回调',
    imgProps: '附加的图片属性',
  },
};

export default {
  title: 'Module/ImageMessage',
  component: ImageMessage,
  argTypes: {
    imageMessage: {
      control: 'object',
      description: description[lang].imageMessage,
    },
    prefix: {
      control: 'text',
      description: description[lang].prefix,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    bubbleClass: {
      control: 'text',
      description: description[lang].bubbleClass,
    },
    onClickImage: {
      type: 'function',
      description: description[lang].onClickImage,
    },
    imgProps: {
      control: 'object',
      description: description[lang].imgProps,
    },
  },
} as Meta<typeof ImageMessage>;

export const Primary = {
  args: {
    imageMessage: {
      type: 'img',
      file_length: 1024,
      file: {
        url: 'https://t7.baidu.com/it/u=848096684,3883475370&fm=193&f=GIF',
        filename: 'test.txt',
        filetype: 'txt',
        data: {} as File,
      },
      url: 'https://t7.baidu.com/it/u=848096684,3883475370&fm=193&f=GIF',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: true,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
    },
    className: 'custom-class',
    bubbleClass: 'bubble-class',
    nickName: 'John Doe',
  },
};

export const Secondly = {
  args: {
    type: 'secondly',
    direction: 'ltr',
    imageMessage: {
      type: 'img',
      file_length: 1024,
      file: {
        url: 'https://t7.baidu.com/it/u=848096684,3883475370&fm=193&f=GIF',
        filename: 'test.txt',
        filetype: 'txt',
        data: {} as File,
      },
      url: 'https://t7.baidu.com/it/u=848096684,3883475370&fm=193&f=GIF',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: true,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
    },
    className: 'custom-class',
    bubbleClass: 'bubble-class',
    nickName: 'Jane Doe',
  },
};
