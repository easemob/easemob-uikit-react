import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import rootStore from '../../module/store/index';
import { ConversationList, ConversationItem } from '../../module/conversation';
import Provider from '../../module/store/Provider';
import { useClient } from '../../module/hooks/useClient';
import Button from '../../component/button';
import ChatroomMessage from '../../module/chatroomMessage';
import { Gift, GiftKeyboard } from '../../module/messageEditor/gift';
import MessageEditor from '../../module/messageEditor';
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
        <ChatroomMessage type="img" />
      </div>
      <div>
        <Gift giftId={3} title="小心心" subTitle="20元" />
        <Gift giftId={2} title="小心心" subTitle="20元" selected />
        <Gift
          giftId={1}
          title="小心心"
          subTitle="20元"
          selected
          action={{ visible: true, text: 'send' }}
        />
      </div>
      <div>
        <GiftKeyboard></GiftKeyboard>
      </div>

      <div>
        <MessageEditor
          actions={[
            { name: 'TEXTAREA', visible: true },
            { name: 'GIFT', visible: true, icon: <GiftKeyboard></GiftKeyboard> },
          ]}
        ></MessageEditor>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('chatroomRoot') as Element).render(
  <div className="container-1">
    <Provider
      initConfig={{
        appKey: 'easemob#easeim',
      }}
    >
      <ChatApp></ChatApp>
    </Provider>
  </div>,
);
