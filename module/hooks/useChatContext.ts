import { useContext, useEffect, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { reaction } from 'mobx';
const useChatContext = () => {
  const rootStore = useContext(RootContext).rootStore;
  const { messageStore } = rootStore;

  const {
    message,
    currentCvsMsgs,
    repliedMessage,
    typing,
    sendMessage,
    deleteMessage,
    recallMessage,
    addReaction,
    deleteReaction,
    translateMessage,
    modifyServerMessage,
    modifyMessage,
    updateMessageStatus,
    sendTypingCmd,
    setRepliedMessage,
    clearMessage,
  } = messageStore;
  const [messageInner, setMessageInner] = useState(message);
  const [repliedMessageInner, setRepliedMessageInner] = useState(repliedMessage);
  const [typingInner, setTypingInner] = useState(typing);
  useEffect(() => {
    const disposer = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return messageStore.message;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        console.log('MobX 变化了 message', newValue, oldValue);
        setMessageInner(newValue);
      },
    );

    const disposerRepliedMsg = reaction(
      () => {
        return messageStore.repliedMessage;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        console.log('MobX 变化了 disposerRepliedMsg', newValue, oldValue);
        setRepliedMessageInner(newValue);
      },
    );

    const disposerTyping = reaction(
      () => {
        return messageStore.typing;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        console.log('MobX 变化了 typing', newValue, oldValue);
        setTypingInner(newValue);
      },
    );

    return () => {
      disposer(); // 清理 reaction
      disposerRepliedMsg();
      disposerTyping();
    };
  }, []);

  return {
    messages: messageInner,
    repliedMessage: repliedMessageInner,
    typing: typingInner,
    sendMessage: sendMessage.bind(messageStore),
    deleteMessage: deleteMessage.bind(messageStore),
    recallMessage: recallMessage.bind(messageStore),
    addReaction: addReaction.bind(messageStore),
    deleteReaction: deleteReaction.bind(messageStore),
    translateMessage: translateMessage.bind(messageStore),
    modifyMessage: modifyServerMessage.bind(messageStore),
    modifyLocalMessage: modifyMessage.bind(messageStore),
    updateMessageStatus: updateMessageStatus.bind(messageStore),
    sendTypingCommand: sendTypingCmd.bind(messageStore),
    setRepliedMessage: setRepliedMessage.bind(messageStore),
    clearMessages: clearMessage.bind(messageStore),
  };
};

export { useChatContext };
