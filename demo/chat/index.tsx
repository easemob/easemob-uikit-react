import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import Header from '../../module/header';
import { Search } from '../../component/input/Search';
import Chat from '../../module/chat';
import { RootProvider } from '../../module/store/rootContext';
import rootStore from '../../module/store/index';
import { ConversationList, ConversationItem } from '../../module/conversation';
import Provider from '../../module/store/Provider';
import { useClient } from '../../module/hooks/useClient';
import Button from '../../component/button';
import Avatar from '../../component/avatar';
import Icon from '../../component/icon';
import { MessageList } from '../../module/chat/MessageList';
import MessageEditor from '../../module/messageInput';
import TextMessage from '../../module/textMessage';
import './index.css';
import { useSDK } from 'module';
// import AgoraChat from 'agora-chat';

const ChatApp = () => {
  const client = useClient();
  const { ChatSDK } = useSDK();
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

  // create a conversation
  const setCurrentCvs = () => {
    rootStore.conversationStore.setCurrentCvs({
      chatType: 'singleChat',
      conversationId: '13681272808',
      lastMessage: {},
    });
  };

  // render custom text message
  const renderTxtMsg = msg => {
    return (
      <TextMessage
        bubbleStyle={{ background: 'hsl(135.79deg 88.79% 36.46%)' }}
        shape="square"
        status={msg.status}
        avatar={<Avatar style={{ background: 'pink' }}>A</Avatar>}
        textMessage={msg}
      ></TextMessage>
    );
  };
  const renderMessage = msg => {
    if (msg.type === 'txt') {
      return renderTxtMsg(msg);
    } else if (msg.type === 'custom') {
      return renderCustomMsg(msg);
    }
  };

  // add an icon to the message editor
  const CustomIcon = {
    visible: true,
    name: 'CUSTOM',
    icon: (
      <Icon
        type="DOC"
        onClick={() => {
          sendCustomMessage();
          console.log('click custom icon');
        }}
      ></Icon>
    ),
  };

  // Implement Sending Custom Messages

  const sendCustomMessage = () => {
    const customMsg = ChatSDK.message.create({
      type: 'custom',
      to: '13681272808', // Need to be the user ID of the current conversation
      chatType: 'singleChat',
      customEvent: 'CARD',
      customExts: {
        id: 'userId3',
      },
    });
    rootStore.messageStore.sendMessage(customMsg).then(() => {
      console.log('send success');
    });
  };

  const renderCustomMsg = msg => {
    return (
      <div>
        <h1>Business Card </h1>
        <div>{msg.customExts.id}</div>
      </div>
    );
  };
  const actions = [...MessageEditor.defaultActions];
  actions.splice(2, 0, CustomIcon);
  return (
    <>
      <div style={{ width: '65%', borderLeft: '1px solid transparent' }}>
        <Chat
          renderMessageList={() => <MessageList renderMessage={renderMessage} />}
          renderMessageInput={() => <MessageEditor actions={actions} />}
        ></Chat>
      </div>
      <Button onClick={setCurrentCvs}>setCurrentCvs</Button>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('chatRoot') as Element).render(
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
