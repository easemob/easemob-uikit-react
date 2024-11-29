import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import TextMessage from '../textMessage';
import CombinedMessage from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/CombinedMessage',
  component: CombinedMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as Meta<typeof CombinedMessage>;

export const Primary = {
  args: {
    bubbleType: 'primary',
    combinedMessage: {
      type: 'combine',
      id: '429727706260',
      to: 'zd2',
      from: 'zd4',
      chatType: 'singleChat',
      time: 1694681306249,
      deliverOnlineOnly: false,
      compatibleText: 'the combine message',
      title: 'Chat History',
      summary: 'zd4: /Audio message/\nzd2: Start a audio call\nzd2: asd\n',
      messageList: [
        {
          id: '1185022473184217860',
          type: 'audio',
          chatType: 'singleChat',
          from: 'zd4',
          to: 'zd2',
          url: 'http://a41-cn.easemob.com/41117440/383391/chatfiles/4b24f130-47e1-11ee-80af-fd4b8c914321?em-redirect=true&share-secret=SyTxOkfhEe6hCBG7YnsUau8y8s0rEj4_Y-mO5YhT8K1WjzqL',
          secret: 'SyTxOkfhEe6hCBG7YnsUau8y8s0rEj4_Y-mO5YhT8K1WjzqL',
          file: {
            filename: 'audio-message.wav',
            filetype: '',
            url: '',
            data: new File([], 'audio-message.wav'),
          },
          filename: 'audio-message.wav',
          length: 2,
          file_length: 65580,
          filetype: '',
          accessToken:
            'YWMtjZekBWi_SRybmYhR2X5krihYwv00w0hrtpGKy_Jc3V3vkp5QYk0R7KtpLQBDs1-jAwMAAAGKkojGGwABUKlE7-wNXfHnQsCya6iFhgJV9CFGmweyTtPqZqy5MuCunw==',
          ext: {},
          time: 1693474345180,
          onlineState: 3,
        },
        {
          id: '1189366073632230160',
          type: 'txt',
          chatType: 'singleChat',
          msg: 'Start a audio call',
          to: 'zd4',
          from: 'zd2',
          ext: {
            action: 'invite',
            channelName: '91512613',
            type: 0,
            callerDevId: 'webim_random_1694485650366',
            callId: '429532068298',
            ts: 1694485668297,
            msgType: 'rtcCallWithAgora',
            callerIMName: 'zd2',
            chatType: 0,
            em_push_ext: {
              type: 'call',
              custom: {
                callId: '429532068298',
              },
            },
            em_apns_ext: {
              em_push_type: 'voip',
            },
          },
          time: 1694485668475,
          onlineState: 3,
        },
        {
          id: '1189528432543795984',
          type: 'txt',
          chatType: 'singleChat',
          msg: 'asd',
          to: 'zd4',
          from: 'zd2',
          ext: {
            em_at_list: [],
            msgQuote: {
              msgID: '1187658028808145668',
              msgPreview: 'Start a video call',
              msgSender: 'zd4',
              msgType: 'txt',
            },
          },
          time: 1694523470608,
          onlineState: 3,
        },
      ],
      bySelf: true,
      // @ts-ignore
      mid: '1190206342359419660',
      status: 'received',
      url: 'http://a41-cn.easemob.com/41117440/383391/chatfiles/797cedd0-52db-11ee-ae18-afa6d37eb8f8?em-redirect=true&share-secret=eX0U4FLbEe6m6Lsrhtl9i9BZ3XW5qTmB_rQZsili0q_RnvMo',
      secret: 'eX0U4FLbEe6m6Lsrhtl9i9BZ3XW5qTmB_rQZsili0q_RnvMo',
      combineLevel: 1,
    },
  },
};

export const Secondly = {
  args: {
    bubbleType: 'secondly',
    direction: 'ltr',
    combinedMessage: {
      type: 'combine',
      id: '429727706260',
      to: 'zd2',
      from: 'zd4',
      chatType: 'singleChat',
      time: 1694681306249,
      deliverOnlineOnly: false,
      compatibleText: 'the combine message',
      title: 'Chat History',
      summary: 'zd4: /Audio message/\nzd2: Start a audio call\nzd2: asd\n',
      messageList: [
        {
          id: '1185022473184217860',
          type: 'audio',
          chatType: 'singleChat',
          from: 'zd4',
          to: 'zd2',
          url: 'http://a41-cn.easemob.com/41117440/383391/chatfiles/4b24f130-47e1-11ee-80af-fd4b8c914321?em-redirect=true&share-secret=SyTxOkfhEe6hCBG7YnsUau8y8s0rEj4_Y-mO5YhT8K1WjzqL',
          secret: 'SyTxOkfhEe6hCBG7YnsUau8y8s0rEj4_Y-mO5YhT8K1WjzqL',
          file: {
            filename: 'audio-message.wav',
            filetype: '',
            url: '',
            data: new File([], 'audio-message.wav'),
          },
          filename: 'audio-message.wav',
          length: 2,
          file_length: 65580,
          filetype: '',
          accessToken:
            'YWMtjZekBWi_SRybmYhR2X5krihYwv00w0hrtpGKy_Jc3V3vkp5QYk0R7KtpLQBDs1-jAwMAAAGKkojGGwABUKlE7-wNXfHnQsCya6iFhgJV9CFGmweyTtPqZqy5MuCunw==',
          ext: {},
          time: 1693474345180,
          onlineState: 3,
        },
        {
          id: '1189366073632230160',
          type: 'txt',
          chatType: 'singleChat',
          msg: 'Start a audio call',
          to: 'zd4',
          from: 'zd2',
          ext: {
            action: 'invite',
            channelName: '91512613',
            type: 0,
            callerDevId: 'webim_random_1694485650366',
            callId: '429532068298',
            ts: 1694485668297,
            msgType: 'rtcCallWithAgora',
            callerIMName: 'zd2',
            chatType: 0,
            em_push_ext: {
              type: 'call',
              custom: {
                callId: '429532068298',
              },
            },
            em_apns_ext: {
              em_push_type: 'voip',
            },
          },
          time: 1694485668475,
          onlineState: 3,
        },
        {
          id: '1189528432543795984',
          type: 'txt',
          chatType: 'singleChat',
          msg: 'asd',
          to: 'zd4',
          from: 'zd2',
          ext: {
            em_at_list: [],
            msgQuote: {
              msgID: '1187658028808145668',
              msgPreview: 'Start a video call',
              msgSender: 'zd4',
              msgType: 'txt',
            },
          },
          time: 1694523470608,
          onlineState: 3,
        },
      ],
      bySelf: true,
      // @ts-ignore
      mid: '1190206342359419660',
      status: 'received',
      url: 'http://a41-cn.easemob.com/41117440/383391/chatfiles/797cedd0-52db-11ee-ae18-afa6d37eb8f8?em-redirect=true&share-secret=eX0U4FLbEe6m6Lsrhtl9i9BZ3XW5qTmB_rQZsili0q_RnvMo',
      secret: 'eX0U4FLbEe6m6Lsrhtl9i9BZ3XW5qTmB_rQZsili0q_RnvMo',
      combineLevel: 1,
    },
  },
};
