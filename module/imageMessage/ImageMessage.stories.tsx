import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import ImageMessage, { ImagePreview } from './index';
import Icon, { IconProps } from '../../src/icon';
import { FileObj } from '../types/messageType';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/ImageMessage',
  component: ImageMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof ImageMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ImageMessage> = args => <ImageMessage {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  imageMessage: {
    type: 'image',
    file_length: 1024,
    file: {
      url: 'https://t7.baidu.com/it/u=848096684,3883475370&fm=193&f=GIF',
      filename: 'test.txt',
      filetype: 'txt',
      data: {} as File,
    },
    url: 'https://t7.baidu.com/it/u=848096684,3883475370&fm=193&f=GIF',
    id: '1234567890',
    to: 'userId',
    chatType: 'singleChat',
    bySelf: true,
    from: 'myUserId',
    time: Date.now(),
    status: 'sent',
  },
};

{
  /* <ImagePreview
  onCancel={() => {
    setImageInfo({ visible: false, url: '' });
  }}
  visible={imageInfo.visible}
  previewImageUrl={imageInfo.url}
></ImagePreview>; */
}
