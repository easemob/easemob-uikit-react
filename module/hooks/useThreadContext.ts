import { useContext, useEffect, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { reaction } from 'mobx';
const useThreadContext = () => {
  const rootStore = useContext(RootContext).rootStore;
  const { threadStore } = rootStore;

  const {
    currentThread,
    threadList,
    showThreadPanel,
    setCurrentThread,
    setThreadVisible,
    getGroupChatThreads,
    getThreadMembers,
    removeChatThreadMember,
    getChatThreadDetail,
  } = threadStore;
  const [currentThreadInner, setCurrentThreadInner] = useState(currentThread);
  const [threadListInner, setThreadListInner] = useState(threadList);
  const [threadVisible, setThreadVisibleInner] = useState(showThreadPanel);
  useEffect(() => {
    const disposer = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return threadStore.currentThread;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        console.log('MobX 变化了 message', newValue, oldValue);
        setCurrentThreadInner(newValue);
      },
    );

    const disposerThreadList = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return threadStore.threadList;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        console.log('MobX 变化了 message', newValue, oldValue);
        setThreadListInner(newValue);
      },
    );

    const disposerThreadVisible = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return threadStore.showThreadPanel;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        console.log('MobX 变化了 message', newValue, oldValue);
        setThreadVisibleInner(newValue);
      },
    );

    return () => {
      disposer(); // 清理 reaction
      disposerThreadList();
      disposerThreadVisible();
    };
  }, []);

  return {
    currentThread: currentThreadInner,
    threadList: threadListInner,
    threadVisible,

    setCurrentThread: setCurrentThread.bind(threadStore),
    setThreadVisible: setThreadVisible.bind(threadStore),
    getGroupChatThreads: getGroupChatThreads.bind(threadStore),
    getThreadMembers: getThreadMembers.bind(threadStore),
    removeChatThreadMember: removeChatThreadMember.bind(threadStore),
    getCurrentChatThreadDetail: getChatThreadDetail.bind(threadStore),
  };
};

export { useThreadContext };
