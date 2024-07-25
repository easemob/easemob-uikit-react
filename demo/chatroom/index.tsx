import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import rootStore from '../../module/store/index';
import { ConversationList, ConversationItem } from '../../module/conversation';
import Provider from '../../module/store/Provider';
import { useClient } from '../../module/hooks/useClient';
import Button from '../../component/button';
import ChatroomMessage from '../../module/chatroomMessage';
// import { Gift, GiftKeyboard } from '../../module/messageEditor/gift';
import MessageEditor from '../../module/messageInput';
import Chatroom from '../../module/chatroom';
import ChatroomMember from '../../module/chatroomMember';
import { MessageList } from '../../module/chat/MessageList';
import './index.css';
import { observer } from 'mobx-react-lite';
import { set } from 'mobx';

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
  const [roomId, setRoomId] = useState('');
  const joinRoom = () => {
    client
      .joinChatRoom({
        roomId: roomId,
      })
      .then(() => {
        console.log('joinChatRoom success');
      });
  };
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
  const renderMessage = message => {
    console.log('msg-', message);
    switch (message.type) {
      case 'txt':
        return <div>{message.msg}</div>;
    }
  };

  return (
    <>
      <Provider
        theme={{
          mode: 'light',
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
          <div>
            <label>roomId</label>
            <input
              onChange={e => {
                setRoomId(e.target.value);
              }}
            ></input>
          </div>
          {/* <div>
            <button onClick={joinRoom}>join</button>
          </div> */}
        </div>

        <div style={{ width: '350px' }}>
          <Chatroom
            chatroomId={roomId}
            // chatroomId="229358390280194"
            // renderMessageList={() => (
            //   <MessageList
            //     conversation={{
            //       chatType: 'chatRoom',
            //       conversationId: '229358390280194',
            //     }}
            //     renderMessage={renderMessage}
            //   />
            // )}
            messageInputProps={{
              giftKeyboardProps: {
                giftConfig: {
                  gifts: [
                    {
                      giftId: '2665752a-e273-427c-ac5a-4b2a9c82b255',
                      giftIcon:
                        'https://fullapp.oss-cn-beijing.aliyuncs.com/uikit/pictures/gift/AUIKitGift1.png',
                      giftName: 'Heart',
                      giftPrice: '1',
                    },
                  ],
                },
              },
            }}
          ></Chatroom>
        </div>
        <div style={{ width: '350px' }}>
          <ChatroomMember chatroomId={roomId}></ChatroomMember>
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
