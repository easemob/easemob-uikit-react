import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import rootStore from '../store';
import VideoMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
import Provider from '../store/Provider';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/VideoMessage',
  component: VideoMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof VideoMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof VideoMessage> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <VideoMessage {...args} />
  </Provider>
);

export const Primary = {
  render: Template,

  args: {
    videoMessage: {
      bySelf: true,
      status: 'read',
      id: '1239518913788642904',
      type: 'video',
      chatType: 'singleChat',
      from: 'zd2',
      to: 'ljn',
      url: 'https://a4-v2.easemob.com/easemob/easeim/chatfiles/dfab9460-bb47-11ee-9588-db947bb82d2a?em-redirect=true&share-secret=36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      secret: '36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      thumb:
        'https://a4-v2.easemob.com/easemob/easeim/chatfiles/dfab9460-bb47-11ee-9588-db947bb82d2a?em-redirect=true&share-secret=36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc&vframe=true',
      thumb_secret: '36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      filename: '9f6982b61c1d8c56a8e7497a4d6c5857.mov',
      length: 0,
      file: {} as FileObj,
      file_length: 4364210,
      filetype: '',
      accessToken:
        'YWMtIf-vkMAHEe6c2MuyWS0mOFzzvlQ7sUrSpVuQGlyIzFRFkCIQGcwR7bF7ZX4Zh6nOAwMAAAGNXlZjFTeeSAAhJwEadorA32-JBb5SxWmTBXO1T2_O0loXuNs0cysMhw',
      ext: {
        ease_chat_uikit_user_info: {
          nickname: '我的名字zd2',
          avatarURL: '',
        },
      },
      time: 1706162786531,
    },
  },
};

export const Secondly = {
  render: Template,

  args: {
    type: 'secondly',
    direction: 'ltr',
    videoMessage: {
      bySelf: false,
      status: 'received',
      id: '1239518913788642904',
      type: 'video',
      chatType: 'singleChat',
      from: 'zd2',
      to: 'ljn',
      url: 'https://a4-v2.easemob.com/easemob/easeim/chatfiles/dfab9460-bb47-11ee-9588-db947bb82d2a?em-redirect=true&share-secret=36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      secret: '36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      thumb:
        'https://a4-v2.easemob.com/easemob/easeim/chatfiles/dfab9460-bb47-11ee-9588-db947bb82d2a?em-redirect=true&share-secret=36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc&vframe=true',
      thumb_secret: '36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      filename: '9f6982b61c1d8c56a8e7497a4d6c5857.mov',
      length: 0,
      file: {} as FileObj,
      file_length: 4364210,
      filetype: '',
      accessToken:
        'YWMtIf-vkMAHEe6c2MuyWS0mOFzzvlQ7sUrSpVuQGlyIzFRFkCIQGcwR7bF7ZX4Zh6nOAwMAAAGNXlZjFTeeSAAhJwEadorA32-JBb5SxWmTBXO1T2_O0loXuNs0cysMhw',
      ext: {
        ease_chat_uikit_user_info: {
          nickname: '我的名字zd2',
          avatarURL: '',
        },
      },
      time: 1706162786531,
    },
  },
};
