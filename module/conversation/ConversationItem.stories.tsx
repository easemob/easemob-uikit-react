import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { ConversationItem } from './index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    conversationItem: 'Conversation item component',
    prefix: 'Prefix',
    style: 'Style',
    className: 'Class name',
    nickname: 'Name displayed in the conversation (user nickname or group name)',
    avatarShape: 'Avatar shape',
    avatarSize: 'Avatar size',
    avatar: 'Avatar',
    onClick: 'Click callback',
    badgeColor: 'Badge color',
    isActive: 'Whether is active',
    data: 'Conversation data',
    renderMessageContent: 'Render message content',
    ripple: 'Whether to enable ripple effect',
    moreAction: 'More action',
    moreAction_visible: 'Whether to show the more action button',
    moreAction_icon: 'More action button icon',
    moreAction_actions: 'Action list',
    formatDateTime: 'Format date time, return formatted time string',
  },
  zh: {
    conversationItem: '会话项组件',
    prefix: '组件类名前缀',
    style: '组件样式',
    className: '组件类名',
    nickname: '会话中展示的名称（用户昵称或者群组名称）',
    avatarShape: '头像形状',
    avatarSize: '头像大小',
    avatar: '头像',
    onClick: '点击回调',
    badgeColor: '未读数气泡颜色',
    isActive: '是否被选中',
    data: '会话数据',
    renderMessageContent: '渲染会话中展示的消息内容',
    ripple: '是否开启点击效果',
    moreAction: '更多操作',
    moreAction_visible: '是否显示更多操作按钮',
    moreAction_icon: '更多操作按钮图标',
    moreAction_actions: '操作列表',
    formatDateTime: '格式化时间，返回格式化后的时间字符串',
  },
};

export default {
  title: 'Module/ConversationItem',
  component: ConversationItem,
  argTypes: {
    className: {
      control: 'text',
      type: 'string',
      description: description[lang].className,
    },
    prefix: {
      control: 'text',
      type: 'string',
      description: description[lang].prefix,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    nickname: {
      control: 'text',
      description: description[lang].nickname,
    },
    avatarShape: {
      control: {
        type: 'select',
        options: ['circle', 'square'],
      },
      description: description[lang].avatarShape,
    },
    avatarSize: {
      control: 'number',
      description: description[lang].avatarSize,
    },
    avatar: {
      control: 'object',
      description: description[lang].avatar,
    },
    onClick: {
      action: 'click',
      description: description[lang].onClick,
    },
    badgeColor: {
      control: 'color',
      description: description[lang].badgeColor,
    },
    isActive: {
      control: 'boolean',
      description: description[lang].isActive,
      data: {
        control: 'object',
        description: description[lang].data,
      },
    },
    renderMessageContent: {
      description: description[lang].renderMessageContent,
    },
    ripple: {
      description: description[lang].ripple,
    },
    moreAction: {
      control: 'object',
      description: description[lang].moreAction,
      table: {
        type: {
          summary: 'object',
          detail: `{
  visible?: boolean; // ${description[lang].moreAction_visible}
  icon?: ReactNode; // ${description[lang].moreAction_icon}
  actions: // ${description[lang].moreAction_actions}
  Array<{
    content: ReactNode; 
    onClick?: (cvs: ConversationData[0]) => void | Promise<boolean>; // 点击操作的回调
  }>;
}`,
        },
      },
    },
    formatDateTime: {
      description: description[lang].formatDateTime,
    },
  },
} as Meta<typeof ConversationItem>;

export const Default = {
  args: {
    data: {
      chatType: 'singleChat',
      conversationId: 'user2',
      name: 'Henry',
      unreadCount: 3,
      lastMessage: {
        id: '1',
        to: 'user2',
        type: 'txt',
        msg: 'hello',
        chatType: 'singleChat',
        from: 'user1',
        time: Date.now(),
      },
    },
  },
};
