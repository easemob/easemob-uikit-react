import { useContext, useEffect, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { use } from 'i18next';
import { reaction } from 'mobx';
const useConversationContext = () => {
  const rootStore = useContext(RootContext).rootStore;
  const { conversationStore } = rootStore;

  const {
    currentCvs,
    conversationList,
    setCurrentCvs,
    deleteConversation,
    topConversation,
    addConversation,
    modifyConversation,
  } = conversationStore;
  const [currentConversation, setCurrentCVS] = useState(currentCvs);
  const [conversationListInner, setConversationListInner] = useState(conversationList);

  useEffect(() => {
    const disposer = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return conversationStore.currentCvs;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        setCurrentCVS(newValue);
      },
    );

    const disposerCVSList = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return conversationStore.conversationList;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        setConversationListInner(newValue);
      },
    );

    return () => {
      disposer(); // 清理 reaction
      disposerCVSList();
    };
  }, []);

  return {
    currentConversation,
    conversationList: conversationListInner,
    setCurrentConversation: setCurrentCvs.bind(conversationStore),
    deleteConversation: deleteConversation.bind(conversationStore),
    topConversation: topConversation.bind(conversationStore),
    addConversation: addConversation.bind(conversationStore),
    modifyConversation: modifyConversation.bind(conversationStore),
  };
};

export { useConversationContext };
