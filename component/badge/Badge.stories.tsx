import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Avatar from '../avatar';
import Badge from './index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
export default {
  title: 'pure component/Badge',
  component: Badge,
  argTypes: {},
} as Meta<typeof Badge>;

const Template: StoryFn<typeof Badge> = args => (
  <Badge {...args}>
    <Avatar>User</Avatar>
  </Badge>
);

const description = {
  en: {
    count: 'Number to show in badge',
    overflowCount: 'Max count to show',
    dot: 'Whether to show red dot without number',
    showZero: 'Whether to show badge when count is zero',
    size: 'Size of the badge',
    offset: 'Offset of the badge, [x, y]',
    title: 'Title of the badge',
    color: 'Color of the badge',
    children: 'The content of the badge',
    className: 'The className of the badge',
  },
  zh: {
    count: '显示在徽标中的数字',
    overflowCount: '最大显示数',
    dot: '是否只显示红点',
    showZero: '当数值为0时，是否展示 Badge',
    size: '徽标的大小',
    offset: '徽标的偏移, [x, y]',
    title: '徽标的标题',
    color: '徽标的颜色',
    children: '徽标的内容',
    className: '徽标的类名',
  },
};

export const Default = {
  render: Template,
  argTypes: {
    count: {
      control: {
        type: 'number',
      },
      description: description[lang].count,
      type: 'number',
    },
    overflowCount: {
      control: {
        type: 'number',
      },
      description: description[lang].overflowCount,
      type: 'number',
    },
    dot: {
      control: {
        type: 'boolean',
      },
      description: description[lang].dot,
      type: 'boolean',
    },
    showZero: {
      control: {
        type: 'boolean',
      },
      description: description[lang].showZero,
      type: 'boolean',
    },
    size: {
      control: {
        type: 'select',
        options: ['default', 'small'],
      },
      description: description[lang].size,
      type: 'string',
    },
    color: {
      control: {
        type: 'color',
      },
      description: description[lang].color,
      type: 'string',
    },
    offset: {
      control: {
        type: 'array',
      },
      description: description[lang].offset,
      type: 'array',
    },
    title: {
      control: {
        type: 'text',
      },
      description: description[lang].title,
      type: 'string',
    },
    className: {
      control: {
        type: 'text',
      },
      description: description[lang].className,
      type: 'string',
    },
    children: {
      control: {
        type: 'text',
      },
      description: description[lang].children,
      type: 'string',
    },
  },
  args: {
    count: 10,
    overflowCount: 99,
    dot: false,
    showZero: false,
    style: {},
    className: '',
    // text: 'hello',
    size: 'default',
    offset: [0, 0],
    title: 'title',
    children: '',
    color: '',
  },
};
