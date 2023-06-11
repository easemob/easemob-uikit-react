import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Tooltip from './index';

export default {
  title: 'pure component/Tooltip',
  component: Tooltip,
} as ComponentMeta<typeof Tooltip>;

const Template: ComponentStory<typeof Tooltip> = args => <Tooltip {...args} />;

// export const WithControl = Template.bind({});

export const Primary = Template.bind({});
// WithControl.args = {
// 	checked: true,
// 	disabled: false,
// };
