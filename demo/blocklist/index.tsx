import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import rootStore from '../../module/store/index';

import Provider from '../../module/store/Provider';
import { useClient } from '../../module/hooks/useClient';
import { Blocklist } from '../../module/blocklist';
import './index.scss';
const ChatApp = () => {
  const client = useClient();
  useEffect(() => {
    console.log('client', client);
    client.open &&
      client
        .open({
          user: 'd92756589b',
          accessToken:
            'YWMt-WBasCPqEe-IXM2GHQhJCFzzvlQ7sUrSpVuQGlyIzFR5kKjQpcQR7azFEyxvxOtOAwMAAAGP7PoBnTeeSAD_mh9JiYmD2Oy5RUwu_mUpM26s8zpGyWhLalGRGd2ewA',
        })
        .then(() => {
          console.log('获取token成功');
        });
  }, [client]);

  return (
    <div style={{ width: '350px', height: '800px', background: '#ddd', display: 'flex' }}>
      <Blocklist style={{ width: '350px' }}></Blocklist>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('blocklistRoot') as Element).render(
  <div className="container">
    <Provider
      initConfig={{
        appKey: 'easemob#easeim',
      }}
      theme={{
        mode: 'light',
      }}
    >
      <ChatApp></ChatApp>
    </Provider>
  </div>,
);
