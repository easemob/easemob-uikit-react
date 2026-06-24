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
import { TextMessage } from '../../module/textMessage';
import './index.css';
import type { ChatSDK } from '../../module/SDK';

const ChatApp = () => {
  const client = useClient();
  useEffect(() => {
    console.log('SDK5 client ready', client);
  }, [client]);

  // create a conversation
  const setCurrentCvs = () => {
    rootStore.conversationStore.setCurrentCvs({
      chatType: 'singleChat',
      conversationId: '13681272808',
      unreadCount: 0,
    });
  };

  // render custom text message
  const renderTxtMsg = (msg: ChatSDK.Message) => {
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
  const renderMessage = (msg: ChatSDK.Message) => {
    if (msg.type === 'text') {
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
    const customMsg = client.chatManager.createCustomMessage({
      conversationId: '13681272808',
      conversationType: 'singleChat',
      event: 'CARD',
      params: {
        id: 'userId3',
      },
    });
    rootStore.messageStore.sendMessage(customMsg).then(() => {
      console.log('send success');
    });
  };

  const renderCustomMsg = (msg: ChatSDK.Message) => {
    const params = msg.type === 'custom' ? msg.body.params || {} : {};
    return (
      <div>
        <h1>Business Card </h1>
        <div>{params.id}</div>
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
