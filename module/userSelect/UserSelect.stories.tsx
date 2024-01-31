import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import UserSelect from './index';
import rootStore from '../store';
import Button from '../../component/button';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/UserSelect',
  component: UserSelect,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof UserSelect>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof UserSelect> = args => (
  <UserSelect {...args} closable={true} enableMultipleSelection={true} />
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  enableMultipleSelection: true,
  closable: true,
  open: true,
  title: '选择用户',
  users: [
    {
      userId: 'zd1',
      nickname: '赵云',
    },
    {
      userId: 'zd2',
      nickname: '关羽',
    },
  ],
  checkedUsers: [
    {
      userId: 'zd1',
      nickname: '赵云',
    },
  ],
  selectedPanelFooter: (
    <div>
      <Button type="primary" style={{ marginRight: '20px', width: '80px' }}>
        确定
      </Button>
      <Button style={{ width: '80px' }}>取消</Button>
    </div>
  ),
};
