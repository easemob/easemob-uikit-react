import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import PinnedMessage from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/PinnedMessage',
  component: PinnedMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    bubbleType: '',
  },
} as ComponentMeta<typeof PinnedMessage>;

rootStore.pinnedMessagesStore.messages = {
  groupChat: {
    '20292712912182': {
      list: [
        {
          pinTime: Date.now(),
          operatorId: 'test',
          message: {
            id: '1189201674950937348',
            type: 'txt',
            chatType: 'groupChat',
            msg: 'Start a audio call',
            to: '182614118957057',
            from: 'zd3',
            ext: {
              action: 'invite',
              type: 3,
              msgType: 'rtcCallWithAgora',
              callId: '429493790825',
              channelName: '49035279',
              callerDevId: 'webim_random_1694446193223',
              ts: 1694447390825,
            },
            time: 1694447391423,
          },
        },
      ],
      cursor: null,
    },
  },
  singleChat: {},
  chatRoom: {},
};
// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof PinnedMessage> = args => {
  rootStore.conversationStore.setCurrentCvs({
    chatType: 'groupChat',
    conversationId: '20292712912182',
    name: 'groupChat',
    unreadCount: 0,
  });
  return (
    <div style={{ height: '500px' }}>
      <Provider
        initConfig={{
          appKey: 'a#b',
        }}
      >
        <PinnedMessage {...args} />
      </Provider>
    </div>
  );
};

const DarkTemplate: ComponentStory<typeof PinnedMessage> = args => {
  rootStore.conversationStore.setCurrentCvs({
    chatType: 'groupChat',
    conversationId: '20292712912182',
    name: 'groupChat',
    unreadCount: 0,
  });
  return (
    <div style={{ height: '500px' }}>
      <Provider
        initConfig={{
          appKey: 'a#b',
        }}
        theme={{
          mode: 'dark',
        }}
      >
        <PinnedMessage {...args} />
      </Provider>
    </div>
  );
};

export const Default = Template.bind({});
export const Dark = DarkTemplate.bind({});
