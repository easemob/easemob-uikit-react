import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import rootStore from '../../module/store/index';
import { ConversationList, ConversationItem } from '../../module/conversation';
import Provider from '../../module/store/Provider';
import { useClient } from '../../module/hooks/useClient';
import Button from '../../component/button';
import ChatroomMessage from '../../module/chatroomMessage';
// import { Gift, GiftKeyboard } from '../../module/messageEditor/gift';
import MessageEditor from '../../module/messageEditor';
import Chatroom from '../../module/chatroom';
import ChatroomMember from '../../module/chatroomMember';
import './index.css';
import { observer } from 'mobx-react-lite';

const ChatApp = observer(() => {
  const client = useClient();
  useEffect(() => {
    if (client.addEventHandler) {
      client.addEventHandler('chatroom', {
        onConnected: () => {
          console.log('登录成功');
        },
      });
    }
  }, [client]);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const login = () => {
    client
      .open({
        user: userId,
        pwd: password,
        //accessToken: '',
      })
      .then(res => {
        console.log('获取token成功');
      });
  };
  return (
    <>
      <Provider
        theme={{
          mode: 'dark',
        }}
        initConfig={{
          appKey: 'easemob#easeim',
        }}
        local={{
          fallbackLng: 'en',
          lng: 'zh',
        }}
      >
        <div>
          <div>
            <label>userID</label>
            <input
              onChange={e => {
                setUserId(e.target.value);
              }}
            ></input>
          </div>
          <div>
            <label>password</label>
            <input
              onChange={e => {
                setPassword(e.target.value);
              }}
            ></input>
          </div>
          <div>
            <button onClick={login}>login</button>
          </div>
        </div>

        <div style={{ width: '350px' }}>
          <Chatroom chatroomId="229358390280194"></Chatroom>
        </div>
        <div style={{ width: '350px' }}>
          <ChatroomMember chatroomId="229358390280194"></ChatroomMember>
        </div>
      </Provider>
    </>
  );
});

ReactDOM.createRoot(document.getElementById('chatroomRoot') as Element).render(
  <div className="container-1">
    <ChatApp></ChatApp>
  </div>,
);
