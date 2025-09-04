import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Checkbox } from './Checkbox';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    checked: 'Whether the checkbox is checked',
    disabled: 'Whether the checkbox is disabled',
    shape: 'The shape of the checkbox',
    className: 'The className of the checkbox',
    style: 'The style of the checkbox',
    onChange: 'The change event of the checkbox',
    defaultChecked: 'The default checked status of the checkbox',
    children: 'The content of the checkbox',
    id: 'The id of the checkbox',
    prefix: 'The prefix of the checkbox className',
  },
  zh: {
    checked: '复选框是否选中',
    disabled: '复选框是否禁用',
    shape: '复选框的形状',
    className: '复选框的类名',
    style: '复选框的样式',
    onChange: '复选框的变化事件',
    defaultChecked: '复选框的默认选中状态',
    children: '复选框的内容',
    id: '复选框的 id',
    prefix: '复选框className的前缀',
  },
};
export default {
  title: 'pure component/Checkbox',
  component: Checkbox,
  argTypes: {
    checked: {
      control: 'boolean',
      description: description[lang].checked,
    },
    disabled: {
      control: 'boolean',
      description: description[lang].disabled,
    },
    shape: {
      control: 'select',
      options: ['square', 'round'],
      description: description[lang].shape,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    onChange: {
      description: description[lang].onChange,
    },
    defaultChecked: {
      control: 'boolean',
      description: description[lang].defaultChecked,
    },
    children: {
      control: 'text',
      description: description[lang].children,
    },
    id: {
      control: 'text',
      description: description[lang].id,
    },
    prefix: {
      control: 'text',
      description: description[lang].prefix,
    },
  },
} as Meta<typeof Checkbox>;

export const WithControl = {};
export const Checked = () => <Checkbox checked>Checkbox</Checkbox>;
export const Disabled = () => <Checkbox disabled />;
export const CheckedDisabled = () => <Checkbox checked disabled />;
