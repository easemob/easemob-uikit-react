import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Button from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'pure component/Button',
  component: Button,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    type: {
      control: 'select',
      options: ['primary', 'ghost', 'text', 'default'],
    },
  },
} as ComponentMeta<typeof Button>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Button> = args => <Button {...args} />;

export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  type: 'primary',
};

// export const Secondary = Template.bind({});
// Secondary.args = {
//   size: 'medium',
// };

// export const Large = Template.bind({});
// Large.args = {
//   size: 'large',
// };

// export const Small = Template.bind({});
// Small.args = {
//   size: 'small',
// };
