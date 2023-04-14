import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Popover } from './Popover';

export default {
	title: 'UI/Popover',
	component: Popover,
} as ComponentMeta<typeof Popover>;

const Template: ComponentStory<typeof Popover> = (args) => (
	<Popover {...args} />
);

export const WithControl = Template.bind({});

WithControl.args = {
	children: 'with control',
};

export const Children = () => <Popover children={'hello, world'} />;
