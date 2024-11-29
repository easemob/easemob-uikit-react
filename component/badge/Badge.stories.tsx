import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Avatar from '../avatar';
import Badge from './index';

export default {
  title: 'pure component/Badge',
  component: Badge,
  argTypes: {},
} as Meta<typeof Badge>;

const Template: StoryFn<typeof Badge> = args => (
  <Badge {...args}>
    <Avatar>User</Avatar>
  </Badge>
);

export const Default = {
  render: Template,

  args: {
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
  },
};
