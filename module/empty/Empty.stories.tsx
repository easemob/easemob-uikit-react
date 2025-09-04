import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Empty from './index';
import Icon, { IconProps } from '../../component/icon';
import classNames from 'classnames';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    prefix: 'Prefix',
    className: 'CSS class',
    style: 'CSS style',
    text: 'Displayed text',
    icon: 'Displayed icon',
  },
  zh: {
    prefix: '前缀',
    className: 'CSS 类名',
    style: 'CSS 样式',
    text: '展示的文本',
    icon: '展示的图标',
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/Empty',
  component: Empty,
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
      type: 'string',
    },
    className: {
      control: 'text',
      description: description[lang].className,
      type: 'string',
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    text: {
      control: 'text',
      description: description[lang].text,
    },
    icon: {
      control: 'object',
      description: description[lang].icon,
    },
  },
} as Meta<typeof Empty>;

export const Default = {
  args: {
    text: 'No Data',
    icon: <Icon type="FILE" width={100} height={100}></Icon>,
  },
};
