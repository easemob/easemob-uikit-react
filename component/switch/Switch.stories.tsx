import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Switch } from './Switch';

export default {
  title: 'pure component/Switch',
  component: Switch,
} as Meta<typeof Switch>;

export const WithControl = {};
export const Checked = () => <Switch checked></Switch>;
export const Disabled = () => <Switch checked disabled></Switch>;
