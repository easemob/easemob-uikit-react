import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Empty from './index';
import Icon, { IconProps } from '../../component/icon';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/Empty',
  component: Empty,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof Empty>;

export const Default = {
  args: {
    text: 'No Data',
    icon: <Icon type="FILE" width={100} height={100}></Icon>,
  },
};
