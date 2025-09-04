import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Switch } from './Switch';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    checked: 'Whether the switch is checked',
    disabled: 'Whether the switch is disabled',
    onChange: 'The change event of the switch',
    className: 'The className of the switch',
    style: 'The style of the switch',
  },
  zh: {
    checked: '开关是否选中',
    disabled: '开关是否禁用',
    onChange: '开关的改变事件',
    className: '开关的类名',
    style: '开关的样式',
  },
};
export default {
  title: 'pure component/Switch',
  component: Switch,
  argTypes: {
    checked: {
      control: 'boolean',
      description: description[lang].checked,
    },
    disabled: {
      control: 'boolean',
      description: description[lang].disabled,
    },
    onChange: {
      description: description[lang].onChange,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
  },
} as Meta<typeof Switch>;

export const WithControl = {};
export const Checked = () => <Switch checked></Switch>;
export const Disabled = () => <Switch checked disabled></Switch>;
