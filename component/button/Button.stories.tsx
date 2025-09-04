import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Button from './index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    type: 'Type of button',
    shape: 'Shape of button',
    size: 'Size of button',
    disabled: 'Disabled state of button',
    icon: 'Icon of button',
    onClick: 'Click event of button',
    ripple: 'Whether to show ripple effect',
    rippleColor: 'Color of ripple effect',
    className: 'The className of the button',
    style: 'The style of the button',
    children: 'The content of the button',
  },
  zh: {
    type: '按钮类型',
    shape: '按钮形状',
    size: '按钮大小',
    disabled: '按钮是否禁用',
    icon: '按钮图标',
    onClick: '按钮点击事件',
    ripple: '是否显示涟漪效果',
    rippleColor: '涟漪效果颜色',
    className: '按钮的类名',
    style: '按钮的样式',
    children: '按钮的内容',
  },
};

export default {
  title: 'pure component/Button',
  component: Button,
  argTypes: {
    type: {
      control: 'select',
      options: ['primary', 'ghost', 'text', 'default'],
      description: description[lang].type,
    },
    shape: {
      control: 'select',
      options: ['circle', 'round', 'default'],
      description: description[lang].shape,
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: description[lang].size,
    },
    disabled: {
      control: 'boolean',
      description: description[lang].disabled,
    },
    icon: {
      control: 'text',
      description: description[lang].icon,
    },
    onClick: {
      action: 'clicked',
      description: description[lang].onClick,
    },
    ripple: {
      control: 'boolean',
      description: description[lang].ripple,
    },
    rippleColor: {
      control: 'color',
      description: description[lang].rippleColor,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    children: {
      control: 'text',
      description: description[lang].children,
    },
  },
} as Meta<typeof Button>;

export const Default = {
  args: {
    type: 'primary',
  },
};
