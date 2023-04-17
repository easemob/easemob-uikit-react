import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import TextMessage from '../../../module/textMessage';

import List from '../../../src/list';
import Header from '../../../module/header';
import { ContactItem, ContactList } from '../../../module/contactList';
import { Search } from '../../../src/input/Search';
import Chat from '../../../module/chat';
import Icon from '../../../src/icon';
import AC from 'agora-chat';
import { RootProvider } from '../../../module/store/rootContext';
import rootStore from '../../../module/store/index';
import { ConversationList } from '../../../module/conversation';
import Provider from '../../../module/store/Provider';
import { useClient } from '../../../module/hooks/useClient';

// import {
// 	Chat,
// 	rootStore,
// 	ConversationList,
// 	Provider,
// 	useClient,
// } from 'chatuim2';
// import 'chatuim2/style.css';
class Test extends React.Component {
  state: { num: { a: number } };
  constructor(props) {
    super(props);
    this.state = {
      num: { a: 1 },
    };
  }
  handleClick() {
    let num2 = this.state.num;
    num2.a++;
    this.setState({
      num: num2,
    });
  }

  render() {
    return (
      <div>
        <span>{this.state.num.a}</span>
        <button onClick={this.handleClick.bind(this)}></button>
      </div>
    );
  }
}

const Entry = () => {
  const client = useClient();
  useEffect(() => {
    client &&
      client
        .open({
          user: 'zd2',
          pwd: '1',
        })
        .then(res => {
          console.log('获取token成功', res, rootStore.client);
        });
  }, [client]);
  return (
    <>
      <div
        style={{
          width: '35%',
          border: '1px solid transparent',
          background: '#fff',
        }}
      >
        <ConversationList></ConversationList>
        {/* <ContactList></ContactList> */}
      </div>
      <div style={{ width: '65%', borderLeft: '1px solid transparent' }}>
        <Chat></Chat>
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
        lng: 'en',
        // resources: {
        // 	zh: {
        // 		translation: {
        // 			hello: '你好呀',
        // 		},
        // 	},
        // },
      }}
    >
      <Entry></Entry>
    </Provider>
  </div>,
);
