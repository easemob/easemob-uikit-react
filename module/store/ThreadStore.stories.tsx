import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import ThreadStore from './ThreadStore'; // 假设这是一个导出的类或对象
import rootStore from '../store';
import Provider from '../store/Provider';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    thread: 'Thread data',
    currentThread: 'Current thread information',
    showThreadPanel: 'Visibility of the thread panel',
    threadList: 'List of threads',
    setThread: 'Set thread data',
    setCurrentThread: 'Set the current thread',
    setThreadVisible: 'Set the visibility of the thread panel',
    updateThreadInfo: 'Update thread information',
    getChatThreadDetail: 'Get details of a chat thread',
    getGroupChatThreads: 'Get group chat threads',
    clear: 'Clear thread data',
    ThreadStore:
      'ThreadStore is a data store that contains thread data, current thread information, and methods to manage these data.',
  },
  zh: {
    thread: '子区数据',
    currentThread: '当前子区信息',
    showThreadPanel: '子区面板的可见性',
    threadList: '子区列表',
    setThread: '设置子区数据',
    setCurrentThread: '设置当前子区',
    setThreadVisible: '设置子区面板的可见性',
    updateThreadInfo: '更新子区信息',
    getChatThreadDetail: '获取聊天子区的详细信息',
    getGroupChatThreads: '获取群聊子区',
    clear: '清除子区数据',
    ThreadStore: 'ThreadStore 是一个数据仓库，包含子区数据、当前子区信息以及管理这些数据的方法。',
  },
};

// 假设我们有一个简单的组件来展示ThreadStore的内容
const ThreadStoreComponent = () => {
  return (
    <div>
      <Provider
        initConfig={{
          appKey: 'a#b',
        }}
      >
        <div>{description[lang].ThreadStore}</div>
      </Provider>
    </div>
  );
};

export default {
  title: 'Store/ThreadStore',
  component: ThreadStoreComponent,
  argTypes: {
    thread: {
      control: 'object',
      description: description[lang].thread,
      table: {
        type: {
          summary: 'object',
          detail: `{
    [key: string]: { // groupId
        [key: string]: { // threadId
            info?: ChatSDK.ThreadChangeInfo & { owner?: string };
            originalMessage: ChatSDK.MessageBody;
        };
    };
}`,
        },
        defaultValue: { summary: '{}' },
      },
    },
    currentThread: {
      control: 'object',
      description: description[lang].currentThread,
      table: {
        type: {
          summary: 'object',
          detail: `{
    visible: boolean;
    creating: boolean;
    info?: ChatSDK.ThreadChangeInfo & { owner?: string; members?: string[] };
    originalMessage: ChatSDK.MessageBody;
}`,
        },
        defaultValue: { summary: '{}' },
      },
    },
    showThreadPanel: {
      control: 'boolean',
      description: description[lang].showThreadPanel,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    threadList: {
      control: 'array',
      description: description[lang].threadList,
      table: {
        type: {
          summary: 'object',
          detail: `{
            [key: string]: (ChatSDK.ChatThreadDetail & { members?: string[] })[];
        }`,
        },
        defaultValue: { summary: '[]' },
      },
    },
    setThread: {
      description: description[lang].setThread,
      table: {
        type: { summary: 'function', detail: '(thread: ThreadData) => void' },
      },
      control: 'function',
    },
    setCurrentThread: {
      description: description[lang].setCurrentThread,
      table: {
        type: { summary: 'function', detail: '(thread: CurrentThread) => void' },
      },
      control: 'function',
    },
    setThreadVisible: {
      description: description[lang].setThreadVisible,
      table: {
        type: { summary: 'function', detail: '(visible: boolean) => void' },
      },
      control: 'function',
    },
    updateThreadInfo: {
      description: description[lang].updateThreadInfo,
      table: {
        type: { summary: 'function', detail: '(threadInfo: ChatSDK.ThreadChangeInfo) => void' },
      },
      control: 'function',
    },
    getChatThreadDetail: {
      description: description[lang].getChatThreadDetail,
      table: {
        type: { summary: 'function', detail: '(threadId: string) => Promise<void>' },
      },
      control: 'function',
    },
    getGroupChatThreads: {
      description: description[lang].getGroupChatThreads,
      table: {
        type: {
          summary: 'function',
          detail: '(parentId: string, cursor?: string) => Promise<string | null>',
        },
      },
      control: 'function',
    },
  },
} as Meta<typeof ThreadStoreComponent>;

const Template: StoryFn<typeof ThreadStoreComponent> = args => <ThreadStoreComponent />;

export const Default = {
  render: Template,
  args: {
    // 根据实际的ThreadStore属性和方法设置默认参数
  },
};
