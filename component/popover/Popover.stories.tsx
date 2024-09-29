import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Popover } from './Popover';

export default {
  title: 'pure component/Popover',
  component: Popover,
} as Meta<typeof Popover>;

const Template: StoryFn<typeof Popover> = args => <Popover {...args} />;

export const Default = () => <Popover>hello, world</Popover>;
