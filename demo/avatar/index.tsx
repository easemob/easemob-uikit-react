import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Avatar from '@/component/avatar';
import image from './avatar.png';
ReactDOM.createRoot(document.getElementById('avatarRoot') as Element).render(
  <div className="container">
    {/* <ConfigProvider
			value={{
				getPrefixCls: () => {
					return 'qqq';
				},
				iconPrefixCls: 'bamboo',
			}}
		> */}
    {/* <Avatar src={image}>12</Avatar> */}
    <Avatar shape="square" size={40}>
      12
    </Avatar>
    <Avatar.Group size={80}>
      <Avatar src={image}>群1</Avatar>
      <Avatar>群2</Avatar>
    </Avatar.Group>

    <Avatar.Group shape="square">
      <Avatar shape="square" src={image}>
        群1
      </Avatar>
      <Avatar shape="square">群2</Avatar>
    </Avatar.Group>
    {/* </ConfigProvider> */}
  </div>,
);
