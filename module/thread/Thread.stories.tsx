import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Thread from './index';
import rootStore from '../store';
import Provider from '../store/Provider';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    prefix: 'CSS class name prefix',
    className: 'CSS class name',
    style: 'CSS style',
    messageListProps: 'Props for MessageList',
    messageInputProps: 'Props for MessageInput',
    Thread:
      'Thread component is a container component that encapsulates the thread function. It is mainly used to display the thread and support creating and joining sub-conversations based on a message. ',
  },
  zh: {
    prefix: '类名前缀',
    className: '类名',
    style: '样式',
    messageListProps: 'MessageList 的 props',
    messageInputProps: 'MessageInput 的 props',
    Thread:
      'Thread 组件是一个容器组件，可以根据一条消息创建一个子会话，封装了会话子区及其消息和输入的功能。子区的入口会显示在消息上，可以点击消息上的子区功能创建或者加入子区，也可以在Chat 组件的 Header 部分点击子区列表进入子区。',
  },
};

const ThreadComponent = (args: any) => {
  return (
    <div style={{ height: '500px' }}>
      <Provider
        initConfig={{
          appKey: 'a#b',
        }}
      >
        <Thread {...args} />
      </Provider>
    </div>
  );
};

export default {
  title: 'Container/Thread',
  component: ThreadComponent,
  parameters: {
    docs: {
      description: {
        component: description[lang].Thread,
      },
    },
  },
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
      defaultValue: 'cui',
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    messageListProps: {
      control: 'object',
      description: description[lang].messageListProps,
    },
    messageInputProps: {
      control: 'object',
      description: description[lang].messageInputProps,
    },
  },
} as Meta<typeof ThreadComponent>;

const Template: StoryFn<typeof ThreadComponent> = args => <ThreadComponent {...args} />;

export const Default = {
  render: Template,
  args: {
    // 根据实际的Thread组件属性和方法设置默认参数
  },
};

export const Dark = {
  render: Template,
  args: {
    // Dark mode specific args
  },
};

export const Square = {
  render: Template,
  args: {
    // Square mode specific args
  },
};
