import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import ChatroomMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/ChatroomMessage',
  component: ChatroomMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof ChatroomMessage>;

export const textMessage = {
  args: {
    message: {
      type: 'txt',
      msg: 'hello',
      id: '1234567890',
      to: 'chatroomId',
      chatType: 'chatRoom',
      // bySelf: true,
      from: 'myUserId',
      time: Date.now(),
      // status: 'sent',
    },
  },
};

export const giftMessage = {
  args: {
    message: {
      id: '1231026004235920980',
      type: 'custom',
      chatType: 'chatRoom',
      from: 'pev4pyzbwnutbp7a',
      to: '230164666580997',
      customEvent: 'CHATROOMUIKITGIFT',
      params: {},
      customExts: {
        chatroom_uikit_gift:
          '{"giftId":"2665752a-e273-427c-ac5a-4b2a9c82b255","giftIcon":"https://fullapp.oss-cn-beijing.aliyuncs.com/uikit/pictures/gift/AUIKitGift1.png","giftName":"Heart","giftPrice":"1"}',
      },
      ext: {
        chatroom_uikit_userInfo: {
          userId: 'pev4pyzbwnutbp7a',
          nickname: '阿朱',
          avatarURL:
            'https://a1.easemob.com/easemob/chatroom-uikit/chatfiles/a27bd9a0-79f8-11ee-8f83-551faec94303',
          gender: 1,
        },
      },
      time: 1704185376943,
      onlineState: 1,
      priority: 'normal',
      broadcast: false,
      // bySelf: false,
    },
  },
};
