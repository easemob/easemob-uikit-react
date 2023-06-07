import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Switch } from './Switch';

export default {
	title: 'UI/Switch',
	component: Switch,
} as ComponentMeta<typeof Switch>;

const Template: ComponentStory<typeof Switch> = (args) => <Switch {...args} />;

export const WithControl = Template.bind({});

// WithControl.args = {
// 	checked: true,
// 	disabled: false,
// };

export const Checked = () => <Switch checked></Switch>;

export const Disabled = () => <Switch checked disabled></Switch>;
