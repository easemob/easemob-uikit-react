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
import { MessageList } from '../../module/chat/MessageList';
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
          user: '13681272809',
          pwd: '272809',
        })
        .then(res => {
          console.log('获取token成功', res, rootStore.client);
        });
  }, [client]);

  console.log('rootStore', rootStore);
  const topConversation = () => {
    rootStore.conversationStore.topConversation({
      chatType: 'singleChat',
      conversationId: '9a0dac930f',
      lastMessage: {},
    });
  };

  const idToName = {
    userId1: 'name1',
    zd2: 'Henry 2',
  };
  return (
    <>
      <div
        style={{
          width: '35%',
        }}
      >
        <ConversationList
          className="conversation"
          renderHeader={() => (
            <Header
              avatar={<Avatar>D</Avatar>}
              content="custom header"
              moreAction={{
                visible: true,
                actions: [
                  {
                    content: 'my info',
                    onClick: () => {
                      console.log('my info');
                    },
                  },
                ],
              }}
            ></Header>
          )}
          renderItem={cvs => {
            return (
              <ConversationItem
                avatar={
                  <Avatar
                    size="normal"
                    shape="square"
                    style={{ background: 'yellow', color: 'black' }}
                  >
                    {idToName[cvs.conversationId] || cvs.conversationId}
                  </Avatar>
                }
                data={{ ...cvs, name: idToName[cvs.conversationId] || cvs.conversationId }}
              />
            );
          }}
        ></ConversationList>
      </div>

      <div>
        <Button onClick={topConversation}>top 2808</Button>
        <br />
      </div>
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
