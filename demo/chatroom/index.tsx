import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import rootStore from '../../module/store/index';
import { ConversationList, ConversationItem } from '../../module/conversation';
import Provider from '../../module/store/Provider';
import { useClient } from '../../module/hooks/useClient';
import Button from '../../component/button';
import ChatroomMessage from '../../module/chatroomMessage';

import './index.css';
import AgoraChat from 'agora-chat';
const ChatApp = () => {
  const client = useClient();
  useEffect(() => {
    client &&
      client
        .open({
          user: '13681272809',
          pwd: '272809',
        })
        .then(res => {
          console.log('获取token成功', res, rootStore.client);
        });
  }, [client]);

  return (
    <>
      <div>
        <ChatroomMessage />
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('chatroomRoot') as Element).render(
  <div className="container">
    <Provider
      initConfig={{
        appKey: 'easemob#easeim',
      }}
    >
      <ChatApp></ChatApp>
    </Provider>
  </div>,
);
