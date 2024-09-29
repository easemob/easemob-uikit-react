import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Tooltip from './index';

export default {
  title: 'pure component/Tooltip',
  component: Tooltip,
} as Meta<typeof Tooltip>;

const Template: StoryFn<typeof Tooltip> = args => <Tooltip {...args}>hover</Tooltip>;

const Template2: StoryFn<typeof Tooltip> = args => <Tooltip {...args}>click</Tooltip>;

export const Hover = {
  render: Template,

  args: {
    title: (
      <ul>
        <li>item 1</li>
        <li>item 2</li>
      </ul>
    ),
  },
};

export const Click = {
  render: Template2,

  args: {
    title: (
      <ul>
        <li>item 1</li>
        <li>item 2</li>
      </ul>
    ),
    trigger: 'click',
  },
};
