import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Checkbox } from './Checkbox';

export default {
  title: 'pure component/Checkbox',
  component: Checkbox,
} as Meta<typeof Checkbox>;

export const WithControl = {};
export const Checked = () => <Checkbox checked>Checkbox</Checkbox>;
export const Disabled = () => <Checkbox disabled />;
export const CheckedDisabled = () => <Checkbox checked disabled />;
