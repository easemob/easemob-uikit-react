import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Avatar from '../avatar';
import Badge from './index';

export default {
	title: 'UI/Badge',
	component: Badge,
	argTypes: {
		backgroundColor: { control: 'color' },
	},
} as ComponentMeta<typeof Badge>;

const Template: ComponentStory<typeof Badge> = (args) => (
	<Badge {...args}>
		<Avatar></Avatar>
	</Badge>
);

export const Primary = Template.bind({});
Primary.args = {
	count: 10,
	overflowCount: 99,
	dot: false,
	showZero: false,
	style: {},
	className: '',
	text: 'hello',
	size: 'default',
	offset: [0, 0],
	title: 'title',
	children: '',
	color: '',
};
