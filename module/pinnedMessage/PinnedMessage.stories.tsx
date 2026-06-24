import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import PinnedMessage, { PinnedMessageProps } from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
import { usePinnedMessage } from '../hooks/usePinnedMessage';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    bubbleClass: 'bubble class',
    message: 'pinned message',
  },
  zh: {
    bubbleClass: '气泡类名',
    message: '被置顶的消息',
  },
};

export default {
  title: 'Module/PinnedMessage',
  component: PinnedMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    bubbleClass: {
      control: 'text',
      description: description[lang].bubbleClass,
    },
    message: {
      control: 'object',
      description: description[lang].message,
    },
  },
} as Meta<typeof PinnedMessage>;

rootStore.pinnedMessagesStore.messages = {
  groupChat: {
    '20292712912182': {
      list: [
        {
          pinnedAt: Date.now(),
          operatorId: 'test',
          messageId: '1189201674950937348',
          conversationId: '20292712912182',
          conversationType: 'groupChat',
          message: {
            msgLocalId: 'pin-local-1',
            msgServerId: '1189201674950937348',
            type: 'text',
            conversationType: 'groupChat',
            conversationId: '20292712912182',
            body: {
              content: 'Start a audio call',
            },
            to: '182614118957057',
            from: 'zd3',
            sender: { userId: 'zd3' },
            status: 'sent',
            direct: 'RECEIVE',
            ext: {
              action: 'invite',
              type: 3,
              msgType: 'rtcCallWithAgora',
              callId: '429493790825',
              channelName: '49035279',
              callerDevId: 'webim_random_1694446193223',
              ts: 1694447390825,
            },
            timestamp: 1694447391423,
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
const Template: StoryFn<PinnedMessageProps> = args => {
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

const DarkTemplate: StoryFn<PinnedMessageProps> = args => {
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

export const Default = {
  render: Template,
};
export const Dark = {
  render: DarkTemplate,
};
