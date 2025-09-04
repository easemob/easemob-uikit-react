import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import UserProfile from './index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    prefix: 'css class name prefix',
    className: 'css class name',
    style: 'css style',
    userId: 'user ID',
  },
  zh: {
    prefix: 'css 类名前缀',
    className: 'css 类名',
    style: 'css 样式',
    userId: '用户ID',
  },
};
export default {
  title: 'Module/UserProfile',
  component: UserProfile,
  argTypes: {
    prefix: {
      description: description[lang].prefix,
      control: {
        type: 'text',
      },
      type: 'string',
    },
    className: {
      description: description[lang].className,
      control: {
        type: 'text',
      },
      type: 'string',
    },
    style: {
      description: description[lang].style,
      control: {
        type: 'object',
      },
    },
    userId: {
      description: description[lang].userId,
      control: {
        type: 'text',
      },
      type: 'string',
    },
  },
} as Meta<typeof UserProfile>;

const DarkTemplate: StoryFn<typeof UserProfile> = args => (
  <Provider initConfig={{ appKey: 'z#b' }} theme={{ mode: 'dark' }}>
    <div style={{ background: '#171a1c' }}>
      <UserProfile {...args} />
    </div>
  </Provider>
);

export const Default = {
  args: {
    userId: 'henry',
  },
};

export const Dark = {
  render: DarkTemplate,

  args: {
    userId: 'tom',
  },
};
