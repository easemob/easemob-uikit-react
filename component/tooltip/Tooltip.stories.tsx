import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Tooltip from './index';

export default {
  title: 'pure component/Tooltip',
  component: Tooltip,
} as ComponentMeta<typeof Tooltip>;

const Template: ComponentStory<typeof Tooltip> = args => <Tooltip {...args}>hover</Tooltip>;

const Template2: ComponentStory<typeof Tooltip> = args => <Tooltip {...args}>click</Tooltip>;

export const Hover = Template.bind({});
export const Click = Template2.bind({});
Hover.args = {
  title: (
    <ul>
      <li>item 1</li>
      <li>item 2</li>
    </ul>
  ),
};
Click.args = {
  title: (
    <ul>
      <li>item 1</li>
      <li>item 2</li>
    </ul>
  ),
  trigger: 'click',
};
