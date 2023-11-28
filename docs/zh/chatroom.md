# 聊天室

聊天室 UIKit 旨在满足大多数用户对泛娱乐场景的聊天室需求。它通过简化 SDK 集成、促进定制和提供全面的文档，在 API 的使用方面（为用户端开发人员）提供了良好的用户体验。

# 快速开始

## 前提条件

开启 Easemob Chat 服务前，请确保已经具备以下要素：

- React 16.8.0 或以上版本；
- React DOM 16.8.0 或以上版本；
- 有效的 Easemob Chat 开发者账号；
- Easemob Chat 项目和 App Key。

## 支持的浏览器

| 浏览器    | 支持的版本 |
| --------- | ---------- |
| IE 浏览器 | 11 或以上  |
| Edge      | 43 或以上  |
| Firefox   | 10 或以上  |
| Chrome    | 54 或以上  |
| Safari    | 11 或以上  |

## 使用步骤

### 1.创建 chatroom 项目

```bash
# 安装 CLI 工具。
npm install create-react-app
# 构建一个 my-app 的项目。
npx create-react-app my-app
cd my-app
```

```
项目目录：
├── package.json
├── public                  # Webpack 的静态目录。
│   ├── favicon.ico
│   ├── index.html          # 默认的单页面应用。
│   └── manifest.json
├── src
│   ├── App.css             # App 根组件的 CSS。
│   ├── App.js              # App 组件代码。
│   ├── App.test.js
│   ├── index.css           # 启动文件样式。
│   ├── index.js            # 启动文件。
│   ├── logo.svg
│   └── serviceWorker.js
└── yarn.lock
```

#### 安装 easemob-chat-uikit

- 通过 npm 安装，运行以下命令：

```bash
npm install easemob-chat-uikit --save
```

- 通过 yarn 安装，运行以下命令：

```bash
yarn add easemob-chat-uikit
```

#### 使用 easemob-chat-uikit 组件构建应用

将 easemob-chat-uikit 库导入你的代码中：

```javascript
// App.js
import React, { Component, useEffect } from 'react';
import { Provider, Chatroom, useClient, rootStore, ChatroomMember } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const ChatroomApp = observer(() => {
  const client = useClient();
  const chatroomId = ''; // 要加入的聊天室
  const appKey = ''; // 你的 appKey

  useEffect(() => {
    if (client.addEventHandler) {
      client.addEventHandler('chatroom', {
        onConnected: () => {
          console.log('登录成功');
        },
      });
    }
  }, [client]);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const login = () => {
    client
      .open({
        user: userId,
        pwd: password,
        //accessToken: '',
      })
      .then(res => {
        console.log('获取token成功');
      });
  };
  return (
    <>
      <Provider
        theme={{
          mode: 'dark',
        }}
        initConfig={{
          appKey: appKey,
        }}
      >
        <div>
          <div>
            <label>userID</label>
            <input
              onChange={e => {
                setUserId(e.target.value);
              }}
            ></input>
          </div>
          <div>
            <label>password</label>
            <input
              onChange={e => {
                setPassword(e.target.value);
              }}
            ></input>
          </div>
          <div>
            <button onClick={login}>login</button>
          </div>
        </div>

        <div style={{ width: '350px' }}>
          <Chatroom chatroomId={chatroomId}></Chatroom>
        </div>
        <div style={{ width: '350px' }}>
          <ChatroomMember chatroomId={chatroomId}></ChatroomMember>
        </div>
      </Provider>
    </>
  );
});
export default ChatroomApp;
```

#### 运行项目并发送你的第一条消息

```bash
npm run start
```

## 如何自定义

### 修改主题

通过 Provider 组件的 theme props 来修改主题

```javascript
import { Chatroom, UIKitProvider } from 'easemob-chat-uikit';

const ChatApp = () => {
  return (
    <UIKitProvider
      theme={{
        mode: 'light', // light or dark
        primaryColor: '#00CE76', // Hexadecimal color value
      }}
    >
      <Chatroom className="customClass" prefix="custom" />
    </UIKitProvider>
  );
};
```

### 修改组件样式

可以通过组件 props 传递 className, style, prefix 修改样式

```javascript
import { Chatroom, Button } from 'easemob-chat-uikit';

const ChatApp = () => {
  return (
    <div>
      <Chatroom className="customClass" prefix="custom" />
      <Button style={{ width: '100px' }}>Button</Button>
    </div>
  );
};
```

### 使用自定义组件

可以通过容器组件的 renderX 方法来渲染自定义组件, 以自定义渲染 header 为例

```javascript
import {Chatroom, Header} from 'easemob-chat-uikit'

const ChatApp = () => {
  const CustomHeader = <Header back content="Custom Header">
  return(
    <div>
      <Chatroom renderHeader={(cvs) => CustomHeader}>
    </div>
  )
}

```

## Chatroom props 总览

<table>
    <tr>
        <td>属性</td>
        <td>类型</td>
        <td>描述</td>
    </tr>
    <tr>
      <td style=font-size:10px> className </td>
      <td style=font-size:10px> string </td>
	  <td style=font-size:10px>组件的类名</td>
	  <tr>
		<td style=font-size:10px>prefix</td>
        <td style=font-size:10px>string</td>
		<td style=font-size:10px>css 类名的前缀 </td>
	  </tr>
      <tr>
		<td style=font-size:10px>style</td>
        <td style=font-size:10px>React.CSSProperties</td>
		<td style=font-size:10px>组件的style</td>
	  </tr>
      <tr>
		<td style=font-size:10px>chatroomId</td>
        <td style=font-size:10px>string</td>
		<td style=font-size:10px>聊天室ID (必须)</td>
	  </tr>
      <tr>
		<td style=font-size:10px>renderEmpty</td>
        <td style=font-size:10px>() => ReactNode</td>
		<td style=font-size:10px>自定义渲染没有会话时的内容</td>
	  </tr>
      <tr>
		<td style=font-size:10px>renderHeader</td>
        <td style=font-size:10px>(roomInfo: ChatroomInfo) => ReactNode</td>
		<td style=font-size:10px>自定义渲染 Header </td>
	  </tr>
	  <tr>
		<td style=font-size:10px>headerProps</td>
        <td style=font-size:10px>HeaderProps</td>
		<td style=font-size:10px>Header 组件的 props</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>renderMessageList</td>
        <td style=font-size:10px>() => ReactNode</td>
		<td style=font-size:10px>自定义渲染 MessageList</td>
	  </tr>
      <tr>
		<td style=font-size:10px>renderMessageEditor</td>
        <td style=font-size:10px>() => ReactNode</td>
		<td style=font-size:10px>自定义渲染消息发送框</td>
	  </tr>
       <tr>
    	<td style=font-size:10px>messageEditorProps</td>
        <td style=font-size:10px>MessageEditorProps</td>
    	<td style=font-size:10px>消息发送框组件的props</td>
      </tr>
      <tr>
    	<td style=font-size:10px>messageEditorProps</td>
        <td style=font-size:10px>MessageEditorProps</td>
    	<td style=font-size:10px>消息发送框组件的props</td>
      </tr>
      <tr>
    	<td style=font-size:10px>messageListProps</td>
        <td style=font-size:10px>MsgListProps</td>
    	<td style=font-size:10px>消息列表组件的props</td>
      </tr>
      <tr>
    	<td style=font-size:10px>renderBroadcast</td>
        <td style=font-size:10px>() => ReactNode</td>
    	<td style=font-size:10px>自定义渲染全局广播组件</td>
      </tr>
        <tr>
    	<td style=font-size:10px>broadcastProps</td>
        <td style=font-size:10px>BroadcastProps</td>
    	<td style=font-size:10px>全局广播组件的 props</td>
      </tr>

   </tr>
</table>

## ChatroomMember props 总览

<table>
    <tr>
        <td>属性</td>
        <td>类型</td>
        <td>描述</td>
    </tr>
    <tr>
      <td style=font-size:10px> className </td>
      <td style=font-size:10px> string </td>
	  <td style=font-size:10px>组件的类名</td>
	  <tr>
		<td style=font-size:10px>prefix</td>
        <td style=font-size:10px>string</td>
		<td style=font-size:10px>css 类名的前缀 </td>
	  </tr>
      <tr>
		<td style=font-size:10px>style</td>
        <td style=font-size:10px>React.CSSProperties</td>
		<td style=font-size:10px>组件的style</td>
	  </tr>
      <tr>
		<td style=font-size:10px>chatroomId</td>
        <td style=font-size:10px>string</td>
		<td style=font-size:10px>聊天室ID (必须)</td>
	  </tr>
      <tr>
		<td style=font-size:10px>renderHeader</td>
        <td style=font-size:10px>(roomInfo: ChatroomInfo) => ReactNode</td>
		<td style=font-size:10px>自定义渲染 Header </td>
	  </tr>
	  <tr>
		<td style=font-size:10px>headerProps</td>
        <td style=font-size:10px>HeaderProps</td>
		<td style=font-size:10px>Header 组件的 props</td>
	  </tr>
      <tr>
		<td style=font-size:10px>memberListProps</td>
        <td style=font-size:10px> {
            search?: boolean; 
            placeholder?: string;
            renderEmpty?: () => ReactNode;
            renderItem?: (item: AppUserInfo) => ReactNode;
            UserItemProps?: UserItemProps;
        }</td>
		<td style=font-size:10px>全部成员组件的props</td>
	  </tr>
      <tr>
		<td style=font-size:10px>muteListProps</td>
        <td style=font-size:10px> {
            search?: boolean;
            placeholder?: string;
            renderEmpty?: () => ReactNode;
            renderItem?: (item: AppUserInfo) => ReactNode;
            UserItemProps?: UserItemProps;
        }</td>
		<td style=font-size:10px>禁言列表组件的props</td>
	  </tr>
   </tr>
</table>

## Context

UIKit 使用 react context 管理全局数据，用户可以使用自定义 hooks 来获取管理数据的方法，可以使用 useChatroomContext 来获取和管理聊天室相关的数据。

### 使用示例

```javascript
import React from 'react';
import { useChatroomContext } from 'easemob-chat-uikit';

const ChatAPP = () => {
  const { chatroom, muteChatRoomMember, unmuteChatRoomMember, removerChatroomMember } =
    useChatroomContext();
  return <div>Chatroom</div>;
};
```

### useChatroomContext 总览

<table>
    <tr>
        <td>属性/方法</td>
        <td>类型</td>
        <td>描述</td>
    </tr> 
    <tr>
        <td>chatroom</td>
        <td style=font-size:10px>ChatroomInfo</td>
        <td style=font-size:10px>聊天室信息</td>
    </tr> 
    <tr>
        <td style=color:blue>muteChatRoomMember</td>
        <td style=font-size:10px>(chatroomId: string, userId: string, muteDuration?: number | undefined) => Promise<void></td>
        <td style=font-size:10px>对成员禁言</td>
    </tr>
    <tr>
        <td style=color:blue>unmuteChatRoomMember</td>
        <td style=font-size:10px>(chatroomId: string, userId: string) => Promise<void></td>
        <td style=font-size:10px>对成员解除禁言</td>
    </tr>
    <tr>
        <td style=color:blue>removerChatroomMember</td>
        <td style=font-size:10px>(chatroomId: string, userId: string) => void</td>
        <td style=font-size:10px>移除成员</td>
    </tr>
</table>
