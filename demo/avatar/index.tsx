import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Avatar from '~/component/avatar';
import image from './avatar.png';
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
  </div>,
);
