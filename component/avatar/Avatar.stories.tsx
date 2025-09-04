import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Avatar from './index';
import type { AvatarProps } from './Avatar';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
console.log('lang:', lang);

const description = {
  en: {
    size: 'The Avatar size, this prop accepts either specific "string" or "number"',
    shape: 'The shape of the Avatar',
    src: 'The address of the image',
    icon: 'The icon of the Avatar',
    style: 'css style',
    prefixCls: 'The prefixCls of the component',
    className: 'The className of the component',
    children: 'The children of the Avatar',
    alt: 'The alt of the Avatar',
    isOnline: 'The online status of the Avatar',
    draggable: 'The draggable of the Avatar',
    crossOrigin: 'The crossOrigin of the Avatar',
    srcSet: 'The srcSet of the Avatar',
    presence:
      'The online status icon of the Avatar, presence.visible is true when it is displayed, presence.text is the online status text, presence.icon is the online status icon',
    onClick: 'The callback when the Avatar is clicked',
    onError: 'The callback when the Avatar',
  },
  zh: {
    size: '头像大小，此属性接受特定的“字符串”或“数字”',
    shape: '头像形状',
    src: '图片地址',
    icon: '头像图标',
    style: 'css 样式',
    prefixCls: '组件的前缀',
    className: '组件的类名',
    children: '头像的子元素',
    alt: '头像的 alt',
    isOnline: '头像的在线状态',
    draggable: '头像的可拖拽',
    crossOrigin: '头像的跨域属性',
    srcSet: '头像的 srcSet',
    presence:
      '头像的在线状态图标, presence.visible 为 true 时显示, presence.text 为在线状态文本, presence.icon 为在线状态图标',
    onClick: '头像点击回调',
    onError: '头像加载错误回调',
  },
};

export default {
  title: 'pure component/Avatar',
  component: Avatar,
  argTypes: {
    size: {
      control: {
        type: 'select',
        options: ['small', 'default', 'large', 50],
      },
      options: ['small', 'default', 'large', 50],
      description: description[lang].size,
      default: 'large',
      // type: 'string',
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      type: 'string',
      description: description[lang].shape,
      default: 'circle',
      defaultValue: 'square',
    },
    src: {
      control: 'text',
      description: description[lang].src,
      type: 'string',
    },
    icon: {
      control: 'object',
      description: description[lang].icon,
    },
    style: {
      control: 'object',
      description: description[lang].style,
      defaultValue: {},
    },
    prefixCls: {
      control: 'text',
      description: description[lang].prefixCls,
      type: 'string',
    },
    className: {
      control: 'text',
      description: description[lang].className,
      type: 'string',
    },
    children: {
      control: 'text',
      description: description[lang].children,
      type: 'string',
    },
    alt: {
      control: 'text',
      description: description[lang].alt,
      type: 'string',
    },
    isOnline: {
      control: 'boolean',
      description: description[lang].isOnline,
      type: 'boolean',
    },
    draggable: {
      control: 'boolean',
      description: description[lang].draggable,
      type: 'boolean',
    },
    crossOrigin: {
      control: 'text',
      description: description[lang].crossOrigin,
      type: 'string',
    },
    srcSet: {
      control: 'text',
      description: description[lang].srcSet,
      type: 'string',
    },
    presence: {
      control: 'object',
      description: description[lang].presence,
    },
    onClick: {
      action: 'clicked',
      description: description[lang].onClick,
    },
    onError: {
      action: 'error',
      description: description[lang].onError,
    },
  },
  args: {
    size: 'default',
    shape: 'circle',
    style: {},
  },
  defaultArgs: {
    size: 'large',
    shape: 'circle',
    style: {},
  },
} as Meta<typeof Avatar>;

export const SingleAvatar = {
  render: (args: AvatarProps) => <Avatar {...args}>U</Avatar>,
};

const GroupTemplate: StoryFn<typeof Avatar.Group> = (args: AvatarProps) => (
  <Avatar.Group shape="square" {...args}>
    <Avatar>U1</Avatar>
    <Avatar>U2</Avatar>
  </Avatar.Group>
);

export const GroupAvatar = {
  render: GroupTemplate,
};
