import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Header, HeaderProps } from './Header';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    className: 'CSS class',
    style: 'CSS style',
    prefix: 'Prefix',
    content: 'Content displayed in the header',
    avatar: 'Avatar displayed in the header',
    presence: 'Presence status',
    subtitle: 'Subtitle displayed in the header',
    icon: 'Icon for more options',
    back: 'Show back button',
    avatarSrc: 'Avatar image source',
    avatarShape: 'Shape of the avatar',
    close: 'Show close button',
    suffixIcon: 'Custom icon on the right',
    renderContent: 'Custom render function for content',
    onClickEllipsis: 'Callback for ellipsis button click',
    moreAction: 'Configuration for more actions button',
    onClickAvatar: 'Callback for avatar click',
    onClickClose: 'Callback for close button click',
    onClickBack: 'Callback for back button click',
  },
  zh: {
    className: 'CSS 类名',
    style: 'CSS 样式',
    prefix: '前缀',
    content: '头部显示的内容',
    avatar: '头部显示的头像',
    presence: '在线状态',
    subtitle: '头部显示的副标题',
    icon: '更多选项的图标',
    back: '显示返回按钮',
    avatarSrc: '头像图片来源',
    avatarShape: '头像的形状',
    close: '显示关闭按钮',
    suffixIcon: '右侧自定义图标',
    renderContent: '自定义渲染内容的函数',
    onClickEllipsis: '省略号按钮点击的回调',
    moreAction: '更多操作按钮的配置',
    onClickAvatar: '头像点击的回调',
    onClickClose: '关闭按钮点击的回调',
    onClickBack: '返回按钮点击的回调',
  },
};

export default {
  title: 'Module/Header',
  component: Header,
  argTypes: {
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    prefix: {
      control: 'text',
      description: description[lang].prefix,
    },
    content: {
      control: 'text',
      description: description[lang].content,
    },
    avatar: {
      control: 'object',
      description: description[lang].avatar,
    },
    presence: {
      control: 'object',
      description: description[lang].presence,
    },
    subtitle: {
      control: 'text',
      description: description[lang].subtitle,
    },
    icon: {
      control: 'object',
      description: description[lang].icon,
    },
    back: {
      control: 'boolean',
      description: description[lang].back,
    },
    avatarSrc: {
      control: 'text',
      description: description[lang].avatarSrc,
    },
    avatarShape: {
      control: 'select',
      options: ['circle', 'square'],
      description: description[lang].avatarShape,
    },
    close: {
      control: 'boolean',
      description: description[lang].close,
    },
    suffixIcon: {
      control: 'object',
      description: description[lang].suffixIcon,
    },
    renderContent: {
      type: 'function',
      description: description[lang].renderContent,
    },
    onClickEllipsis: {
      type: 'function',
      description: description[lang].onClickEllipsis,
    },
    moreAction: {
      control: 'object',
      description: description[lang].moreAction,
    },
    onClickAvatar: {
      type: 'function',
      description: description[lang].onClickAvatar,
    },
    onClickClose: {
      type: 'function',
      description: description[lang].onClickClose,
    },
    onClickBack: {
      type: 'function',
      description: description[lang].onClickBack,
    },
  },
} as Meta<typeof Header>;

const Template: StoryFn<typeof Header> = args => <Header {...args} />;

export const Default = {
  render: Template,
  args: {
    content: 'Header Content',
    back: true,
    close: true,
  },
};
