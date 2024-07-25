import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Avatar from '../avatar';
import Badge from './index';

export default {
  title: 'pure component/Badge',
  component: Badge,
  argTypes: {},
} as ComponentMeta<typeof Badge>;

const Template: ComponentStory<typeof Badge> = args => (
  <Badge {...args}>
    <Avatar>User</Avatar>
  </Badge>
);

export const Default = Template.bind({});
Default.args = {
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
};
