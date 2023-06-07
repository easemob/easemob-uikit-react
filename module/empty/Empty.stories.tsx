import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Empty from './index';
import Icon, { IconProps } from '../../component/icon';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/Empty',
  component: Empty,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof Empty>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Empty> = args => <Empty {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  text: 'No Data',
  icon: [<Icon type="FILE" width={100} height={100}></Icon>],
};
