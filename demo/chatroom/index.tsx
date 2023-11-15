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
import AgoraChat from 'agora-chat';
const ChatApp = observer(() => {
  const client = useClient();
  useEffect(() => {
    // client &&
    //   client
    //     .open({
    //       user: 'user1',
    //       pwd: '1',
    //       //accessToken:
    //       // 'YWMtavtk4ljrEe6_JQ8mGmNhkVzzvlQ7sUrSpVuQGlyIzFQLSg3AGHsR7bfQlcHY0wi4AwMAAAGKuptuCDeeSAAMKLREpHQlQQNnhOGUgKCCyP7YA0AC0nEo9PAJ9l94RQ',
    //     })
    //     .then(res => {
    //       console.log('获取token成功', res, rootStore.client);
    //     });
    if (client.addEventHandler) {
      client.addEventHandler('chatroom', {
        onConnected: () => {
          console.log('登录成功');
          rootStore.setLoginState(true);
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
        //accessToken:
        // 'YWMtavtk4ljrEe6_JQ8mGmNhkVzzvlQ7sUrSpVuQGlyIzFQLSg3AGHsR7bfQlcHY0wi4AwMAAAGKuptuCDeeSAAMKLREpHQlQQNnhOGUgKCCyP7YA0AC0nEo9PAJ9l94RQ',
      })
      .then(res => {
        console.log('获取token成功', res, rootStore.client);
      });
  };

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  return (
    <>
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
        <div>
          <button
            onClick={() => {
              setThemeMode(() => {
                return themeMode === 'light' ? 'dark' : 'light';
              });
            }}
          >
            change theme
          </button>
        </div>
      </div>

      <div style={{ width: '350px' }}>
        <Chatroom chatroomId="229358390280194"></Chatroom>
      </div>
      <div style={{ width: '350px', background: 'rgb(240 234 234 / 43%)' }}>
        <ChatroomMember chatroomId="229358390280194"></ChatroomMember>
      </div>
    </>
  );
});

ReactDOM.createRoot(document.getElementById('chatroomRoot') as Element).render(
  <div className="container-1">
    <Provider
      theme={{
        mode: 'dark',
      }}
      initConfig={{
        appKey: 'easemob#easeim',
        // userId: 'lxm',
        // token:
        //   '007eJxTYKhcEV1UGPCx/Uyo+ZzsEz+mxeeb7qioWmTs8MxhVtq+VkEFhjTDlGRzc4uklJRkMxOzxBSLNCMzA0tzs+REoxQDQ9NkN3O91IZARoaQtNUKjAysDIxACOKrMFhYpiQnmRsb6JoZmaToGhqmJutappkY6hobW1gYpiaaJqUmGQEAnq8nVg==',
      }}
    >
      <ChatApp></ChatApp>
    </Provider>
  </div>,
);
