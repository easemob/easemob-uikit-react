import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Checkbox } from './Checkbox';

export default {
	title: 'UI/Checkbox',
	component: Checkbox,
} as ComponentMeta<typeof Checkbox>;

const Template: ComponentStory<typeof Checkbox> = (args) => (
	<Checkbox {...args} />
);

export const WithControl = Template.bind({});

export const Checked = () => <Checkbox checked>Checkbox</Checkbox>;

export const Disabled = () => <Checkbox disabled />;

export const CheckedDisabled = () => <Checkbox checked disabled />;
