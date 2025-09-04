import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import BaseMessage from './index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    baseMessage: 'Base message received from SDK',
    id: 'Message dom id',
    reactionData: 'Message reply data',
    bubbleType: 'Bubble type',
    bubbleStyle: 'Bubble style',
    status: 'Message status',
    avatar: 'Avatar',
    avatarShape: 'Avatar shape',
    showAvatar: 'Show avatar',
    showMessageInfo: 'Show message avatar nickname info',
    direction: 'Left layout/right layout',
    prefix: 'Class name prefix of the component',
    shape: 'Bubble shape',
    arrow: 'Bubble has arrow',
    nickName: 'Nickname',
    className: 'Class name',
    children: 'Child element',
    style: 'Message component style',
    time: 'Message timestamp',
    hasRepliedMsg: 'Has replied message',
    repliedMessage: 'Message replied',
    customAction: 'Custom actions for messages, such as recall, delete, etc.',
    reaction: 'Show emoji reply function',
    select: 'Show message selection box',
    messageStatus: 'Show message status',
    message: 'Message received from SDK',
    onReplyMessage: 'Reply message callback function',
    onDeleteMessage: 'Delete message callback function',
    onAddReactionEmoji: 'Add reaction emoji callback function',
    onDeleteReactionEmoji: 'Delete reaction emoji callback function',
    onShowReactionUserList: 'Callback function to show user list when hovering over emoji reply',
    onRecallMessage: 'Recall message callback function',
    onTranslateMessage: 'Translate message callback function',
    onModifyMessage: 'Modify message callback function',
    onSelectMessage: 'Select message callback function',
    onResendMessage: 'Resend message callback function',
    onForwardMessage: 'Forward message callback function',
    onReportMessage: 'Report message callback function',
    onPinMessage: 'Pin message callback function',
    onMessageCheckChange: 'Select message callback function',
    renderUserProfile:
      'Callback function to display user information when clicking on user avatar, the parameter is user information, and return a ReactNode',
    onCreateThread: 'Create sub-area callback function',
    thread: 'Whether to display the sub-area',
    chatThreadOverview: 'Sub-area information',
    showNicknamesForAllMessages:
      'Whether all messages display nicknames, default false, self-sent messages do not display nicknames, single chat messages do not display nicknames, group chat messages from others display nicknames',
    onClickThreadTitle: 'Click the callback function of the sub-area title',
    reactionConfig: 'Emoji reply configuration',
    formatDateTime:
      'Callback function to format the timestamp, the parameter is the timestamp, and return a string',
  },
  zh: {
    baseMessage: '从SDK收到的基础消息',
    id: '消息dom的id',
    reactionData: '消息的回复数据',
    bubbleType: '气泡类型',
    bubbleStyle: '气泡样式',
    status: '消息状态',
    avatar: '头像',
    avatarShape: '头像形状',
    showAvatar: '是否显示头像',
    showMessageInfo: '是否显示消息头像昵称信息',
    direction: '左侧布局/右侧布局',
    prefix: '类名前缀',
    shape: '气泡形状',
    arrow: '气泡是否有箭头',
    nickName: '昵称',
    className: '类名',
    children: '子元素',
    style: '消息组件样式',
    time: '消息时间戳',
    hasRepliedMsg: '是否有回复消息',
    repliedMessage: '被回复的消息',
    customAction: '对消息自定义的操作，比如撤回，删除等',
    reaction: '是否显示表情回复功能',
    select: '是否显示消息选择框',
    messageStatus: '是否显示消息状态',
    message: '从SDK收到的消息',
    onReplyMessage: '点击回复消息的回调函数',
    onDeleteMessage: '点击删除消息的回调函数',
    onAddReactionEmoji: '点击添加表情回复的回调函数',
    onDeleteReactionEmoji: '点击删除表情回复的回调函数',
    onShowReactionUserList: '鼠标hover到表情回复时展示用户列表的回调函数',
    onRecallMessage: '点击撤回消息的回调函数',
    onTranslateMessage: '点击翻译消息的回调函数',
    onModifyMessage: '点击修改消息的回调函数',
    onSelectMessage: '点击选择消息的回调函数',
    onResendMessage: '点击重发消息的回调函数',
    onForwardMessage: '点击转发消息的回调函数',
    onReportMessage: '点击举报消息的回调函数',
    onPinMessage: '点击置顶消息的回调函数',
    onMessageCheckChange: '点击选择消息的回调函数',
    renderUserProfile: '点击用户头像显示用户信息的回调函数，传入参数为用户信息，返回一个ReactNode',
    onCreateThread: '点击创建子区的回调函数',
    thread: '是否显示子区',
    chatThreadOverview: '子区信息',
    showNicknamesForAllMessages:
      '是否所有的消息都展示昵称，默认false, 自己发的消息不展示昵称，单聊消息不展示昵称，群聊其他人的消息展示昵称',
    onClickThreadTitle: '点击子区标题的回调函数',
    reactionConfig: '表情回复配置',
    formatDateTime: '格式化时间戳的回调函数，传入参数为时间戳，返回一个字符串',
  },
};

export default {
  title: 'Module/BaseMessage',
  component: BaseMessage,
  // 把下面所有的description都替换成description[lang]
  argTypes: {
    id: {
      control: 'text',
      description: description[lang].id,
    },
    reactionData: {
      control: 'object',
      description: description[lang].reactionData,
    },
    bubbleType: {
      control: 'select',
      options: ['primary', 'secondly', 'none'],
      description: description[lang].bubbleType,
    },
    bubbleStyle: {
      control: 'object',
      description: description[lang].bubbleStyle,
    },
    status: {
      control: 'select',
      options: ['sending', 'sent', 'failed', 'received', 'read'],
      description: description[lang].status,
    },
    avatar: {
      control: 'object',
      description: description[lang].avatar,
    },
    avatarShape: {
      control: 'select',
      options: ['circle', 'square'],
      description: description[lang].avatarShape,
    },
    showAvatar: {
      control: 'boolean',
      description: description[lang].showAvatar,
    },
    showMessageInfo: {
      control: 'boolean',
      description: description[lang].showMessageInfo,
    },
    direction: {
      control: 'select',
      options: ['ltr', 'rtl'],
      description: description[lang].direction,
    },
    prefix: {
      control: 'text',
      description: description[lang].prefix,
    },
    shape: {
      control: 'select',
      options: ['round', 'square'],
      description: description[lang].shape,
    },
    arrow: {
      control: 'boolean',
      description: description[lang].arrow,
    },
    nickName: {
      control: 'text',
      description: description[lang].nickName,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    children: {
      control: 'object',
      description: description[lang].children,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    time: {
      control: 'number',
      description: description[lang].time,
    },
    hasRepliedMsg: {
      control: 'boolean',
      description: description[lang].hasRepliedMsg,
    },
    repliedMessage: {
      control: 'object',
      description: description[lang].repliedMessage,
    },
    customAction: {
      control: 'object',
      description: description[lang].customAction,
    },
    reaction: {
      control: 'boolean',
      description: description[lang].reaction,
    },
    select: {
      control: 'boolean',
      description: description[lang].select,
    },
    messageStatus: {
      control: 'boolean',
      description: description[lang].messageStatus,
    },
    message: {
      control: 'object',
      description: description[lang].message,
    },
    onReplyMessage: {
      action: 'reply message',
      description: description[lang].onReplyMessage,
    },
    onDeleteMessage: {
      action: 'delete message',
      description: description[lang].onDeleteMessage,
    },
    onAddReactionEmoji: {
      action: 'add reaction emoji',
      description: description[lang].onAddReactionEmoji,
    },
    onDeleteReactionEmoji: {
      action: 'delete reaction emoji',
      description: description[lang].onDeleteReactionEmoji,
    },
    onShowReactionUserList: {
      action: 'show reaction user list',
      description: description[lang].onShowReactionUserList,
    },
    onRecallMessage: {
      action: 'recall message',
      description: description[lang].onRecallMessage,
    },
    onTranslateMessage: {
      action: 'translate message',
      description: description[lang].onTranslateMessage,
    },
    onModifyMessage: {
      action: 'modify message',
      description: description[lang].onModifyMessage,
    },
    onSelectMessage: {
      action: 'select message',
      description: description[lang].onSelectMessage,
    },
    onResendMessage: {
      action: 'resend message',
      description: description[lang].onResendMessage,
    },
    onForwardMessage: {
      action: 'forward message',
      description: description[lang].onForwardMessage,
    },
    onReportMessage: {
      action: 'report message',
      description: description[lang].onReportMessage,
    },
    onPinMessage: {
      action: 'pin message',
      description: description[lang].onPinMessage,
    },
    onMessageCheckChange: {
      action: 'message check change',
      description: description[lang].onMessageCheckChange,
    },
    renderUserProfile: {
      control: 'object',
      description: description[lang].renderUserProfile,
    },
    onCreateThread: {
      action: 'create thread',
      description: description[lang].onCreateThread,
    },
    thread: {
      control: 'object',
      description: description[lang].thread,
    },
    chatThreadOverview: {
      control: 'object',
      description: description[lang].chatThreadOverview,
    },
    showNicknamesForAllMessages: {
      control: 'boolean',
      description: description[lang].showNicknamesForAllMessages,
    },
    onClickThreadTitle: {
      action: 'click thread title',
      description: description[lang].onClickThreadTitle,
    },
    reactionConfig: {
      control: 'object',
      description: description[lang].reactionConfig,
    },
    formatDateTime: {
      control: 'object',
      description: description[lang].formatDateTime,
    },
  },
} as Meta<typeof BaseMessage>;

export const Primary = {
  args: {
    bubbleType: 'primary',
  },
};
