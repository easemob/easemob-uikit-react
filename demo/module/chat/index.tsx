import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import TextMessage from '../../../module/textMessage';

import List from '../../../component/list';
import Header from '../../../module/header';
import { ContactItem, ContactList } from '../../../module/contactList';
import { Search } from '../../../component/input/Search';
import Chat from '../../../module/chat';
import Icon from '../../../component/icon';
import AC from 'agora-chat';
import { RootProvider } from '../../../module/store/rootContext';
import rootStore from '../../../module/store/index';
import { ConversationList } from '../../../module/conversation';
import Provider from '../../../module/store/Provider';
import { useClient } from '../../../module/hooks/useClient';
import { getLinkPreview, getPreviewFromContent } from 'link-preview-js';
import Button from '../../../component/button';
import Avatar from '../../../component/avatar';
import { MessageList } from '../../../module/chat/MessageList';
import './index.css';
// import {
// 	Chat,
// 	rootStore,
// 	ConversationList,
// 	Provider,
// 	useClient,
// } from 'chatuim2';
// import 'chatuim2/style.css';

const ChatApp = () => {
  const client = useClient();
  useEffect(() => {
    client &&
      client
        .open({
          user: '13681272808',
          pwd: '272808',
        })
        .then(res => {
          console.log('获取token成功', res, rootStore.client);
        });
  }, [client]);

  const getUrlPreviewInfo = () => {
    getLinkPreview(
      'https://api-ref.agora.io/en/chat-sdk/ios/1.x/interface_agora_chat_client.html#a3e0c211f850af4dfe61c0581f3b7aea7',
    )
      .then(data => console.log(123, data))
      .catch(e => {
        console.log(22, e);
      });
  };
  console.log('rootStore', rootStore);
  const topConversation = () => {
    rootStore.conversationStore.topConversation({
      chatType: 'singleChat',
      conversationId: '9a0dac930f',
      lastMessage: {},
    });
  };

  let TxtMsg = msg => (
    <TextMessage
      bubbleType="secondly"
      bubbleStyle={{ background: 'hsl(135.79deg 88.79% 36.46%)' }}
      shape="square"
      arrow={false}
      avatar={<Avatar style={{ background: 'pink' }}>zhangdong</Avatar>}
      textMessage={{
        msg: msg.msg || 'hello',
        type: 'txt',
        id: '1234',
        to: 'zd5',
        from: 'zd2',
        chatType: 'singleChat',
        time: Date.now(),
        status: 'read',
        bySelf: true,
      }}
    ></TextMessage>
  );

  let MsgList = <MessageList renderMessage={msg => TxtMsg(msg)}></MessageList>;

  return (
    <>
      <div
        style={{
          width: '35%',
          border: '1px solid transparent',
          background: '#fff',
        }}
      >
        <ConversationList className="conversation"></ConversationList>
        {/* <ContactList></ContactList> */}
      </div>
      <div style={{ width: '65%', borderLeft: '1px solid transparent', overflow: 'hidden' }}>
        <Chat></Chat>
      </div>
      <div>
        <Button onClick={getUrlPreviewInfo}>getUrlPreviewInfo</Button>
        <Button onClick={topConversation}>top 2808</Button>
        <br />
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('chatRoot') as Element).render(
  <div
    className="container"
    style={{
      display: 'flex',
      position: 'absolute',
      width: '90%',
      height: '90%',
      marginLeft: '5%',
    }}
  >
    <Provider
      initConfig={{
        appKey: 'easemob#easeim',
      }}
      local={{
        fallbackLng: 'en',
        lng: 'zh',
        // resources: {
        //   en: {
        //     translation: {
        //       'module.conversationTitle': 'Conversation List 22',
        //       'module.deleteCvs': 'Delete Conversation 22',
        //     },
        //   },
        // },
      }}
    >
      <ChatApp></ChatApp>
    </Provider>
  </div>,
);
