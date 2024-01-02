import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import ChatroomMember from './index';
import rootStore from '../store';
import Provider from '../store/Provider';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Container/ChatroomMember',
  component: ChatroomMember,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    bubbleType: '',
  },
} as ComponentMeta<typeof ChatroomMember>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

rootStore.client.user = 'zd2';
rootStore.addressStore.chatroom = [
  {
    id: '123456',
    affiliations: [{ member: 'zd1', owner: 'zd2' }],
    membersId: ['zd1', 'zd2'],
    admins: [],
    muteList: ['zd2'],
    affiliations_count: 2,
    allowinvites: false,
    created: 1629780000000,
    description: '',
    maxusers: 200,
    name: 'test',
    owner: 'zd2',
    public: true,
    custom: '',
    membersonly: false,
    mute: false,
    shieldgroup: false,
  },
];

const Template: ComponentStory<typeof ChatroomMember> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
    >
      <ChatroomMember {...args} chatroomId="123456" />
    </Provider>
  </div>
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};
