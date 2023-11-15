import { useContext, useEffect, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { reaction } from 'mobx';

const useChatroomContext = () => {
  const rootStore = useContext(RootContext).rootStore;
  const { addressStore } = rootStore;
  const { muteChatRoomMember, unmuteChatRoomMember, removerChatroomMember } = addressStore;
  const [chatroom, setChatroom] = useState(addressStore.chatroom);
  useEffect(() => {
    const disposer = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return addressStore.chatroom;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        setChatroom(newValue);
      },
    );

    return () => {
      disposer(); // 清理 reaction
    };
  }, []);
  return {
    chatroom,
    muteChatRoomMember: muteChatRoomMember.bind(addressStore),
    unmuteChatRoomMember: unmuteChatRoomMember.bind(addressStore),
    removerChatroomMember: removerChatroomMember.bind(addressStore),
  };
};

export { useChatroomContext };
