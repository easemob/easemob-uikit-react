import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Avatar from '~/component/avatar';
import image from './avatar.png';
import { Provider } from '../../module';
import Tabs from '~/component/tabs';
import Drawer from '~/component/drawer';

import Collapse from '~/component/collapse';
import './index.scss';

const items = [
  { id: 1, avatar: 'avatar1.png', name: 'User 1' },
  { id: 2, avatar: 'avatar2.png', name: 'User 2' },
  { id: 3, avatar: 'avatar3.png', name: 'User 3' },
  { id: 4, avatar: 'avatar4.png', name: 'User 4' },
  { id: 5, avatar: 'avatar5.png', name: 'User 5' },
];

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

    <Avatar
      shape="square"
      src="https://a1.easemob.com/easemob/chatroom-uikit/chatfiles/7345d230-79f8-11ee-a0d1-5f74d88fa308"
    ></Avatar>
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
    <div>
      <Drawer>sss</Drawer>
    </div>
    <div>
      <Collapse items={items} isHorizontal={false} title=">>>" content={<div>11</div>}></Collapse>
    </div>
  </div>,
);
