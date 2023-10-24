import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Avatar from '~/component/avatar';
import image from './avatar.png';
import { Provider } from '../../module';
import Tabs from '~/component/tabs';
import './index.scss';
ReactDOM.createRoot(document.getElementById('avatarRoot') as Element).render(
  <div className="container" style={{ padding: '100px' }}>
    {/* <ConfigProvider
			value={{
				getPrefixCls: () => {
					return 'qqq';
				},
				iconPrefixCls: 'bamboo',
			}}
		> */}
    {/* <Avatar src={image}>12</Avatar> */}
    <Avatar shape="square" size={80} isOnline>
      12
    </Avatar>
    <Avatar size={80} isOnline>
      33
    </Avatar>

    <Avatar.Group size={80}>
      <Avatar size={80} isOnline>
        群1
      </Avatar>
      <Avatar size={80}>群2</Avatar>
    </Avatar.Group>

    <Avatar.Group shape="square">
      <Avatar shape="square">群1</Avatar>
      <Avatar shape="square">群2</Avatar>
    </Avatar.Group>
    {/* </ConfigProvider> */}

    <div className="container2">
      <div className="dot"></div>
    </div>
    <div style={{ width: '400px', height: '400px', border: '1px solid red' }}>
      <Provider initConfig={{ appKey: 'easre#qws' }}>
        <Tabs
          defaultActiveKey="1"
          onChange={key => {
            console.log('onChange', key);
          }}
          onTabClick={key => {
            console.log('onTabClick', key);
          }}
          tabs={[
            {
              label: `Tab 1`,
              key: '1',
              content: `Content of Tab Pane 1`,
            },
            {
              disabled: true,
              label: `Tab 2`,
              key: '2',
              content: `Content of Tab Pane 2`,
            },
            {
              label: `Tab 3`,
              key: '3',
              content: `Content of Tab Pane 3`,
            },
          ]}
        ></Tabs>
      </Provider>
    </div>
  </div>,
);
