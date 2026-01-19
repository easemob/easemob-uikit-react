# 聊天室快速开始

聊天室 UIKit 旨在满足大多数用户对泛娱乐场景的聊天室需求。它通过简化 SDK 集成、促进定制和提供全面的文档，在 API 的使用方面（为用户端开发人员）提供了良好的用户体验。

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

### 1. 创建聊天室项目

```bash
# 安装 CLI 工具。
npm install create-react-app
# 构建一个 my-app 的项目。
npx create-react-app my-app
cd my-app
```

项目目录结构：

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

### 2. 安装 easemob-chat-uikit

- 通过 npm 安装，运行以下命令：

```bash
npm install easemob-chat-uikit --save
```

- 通过 yarn 安装，运行以下命令：

```bash
yarn add easemob-chat-uikit
```

### 3. 使用 easemob-chat-uikit 组件构建应用

将 easemob-chat-uikit 库导入你的代码中：

```javascript
// App.js
import React, { useState, useEffect } from 'react';
import { Provider, Chatroom, useClient, rootStore, ChatroomMember } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const ChatroomApp = () => {
  const client = useClient();
  const chatroomId = ''; // 要加入的聊天室 ID
  const appKey = ''; // 你的 App Key

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
        // accessToken: '', // 也可以使用 token 登录
      })
      .then(res => {
        console.log('获取 token 成功');
      })
      .catch(err => {
        console.error('登录失败', err);
      });
  };

  return (
    <>
      <Provider
        theme={{
          mode: 'dark', // 'light' | 'dark'
        }}
        initConfig={{
          appKey: appKey,
        }}
      >
        <div>
          <div>
            <label>userID</label>
            <input
              value={userId}
              onChange={e => {
                setUserId(e.target.value);
              }}
            />
          </div>
          <div>
            <label>password</label>
            <input
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
              }}
            />
          </div>
          <div>
            <button onClick={login}>登录</button>
          </div>
        </div>

        <div style={{ width: '350px', height: '600px' }}>
          <Chatroom chatroomId={chatroomId} />
        </div>
        <div style={{ width: '350px', height: '600px' }}>
          <ChatroomMember chatroomId={chatroomId} />
        </div>
      </Provider>
    </>
  );
};

export default ChatroomApp;
```

### 4. 运行项目并发送你的第一条消息

```bash
npm run start
```

## 使用 Token 登录（推荐）

如果你已经有用户 Token，可以在初始化时直接传入，UIKit 会自动登录：

```javascript
import React from 'react';
import { Provider, Chatroom } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const ChatroomApp = () => {
  const chatroomId = ''; // 要加入的聊天室 ID
  const appKey = ''; // 你的 App Key
  const userId = ''; // 用户 ID
  const token = ''; // 用户 Token

  return (
    <Provider
      theme={{
        mode: 'light',
      }}
      initConfig={{
        appKey: appKey,
        userId: userId,
        token: token, // 传入 token，UIKit 会自动登录
      }}
    >
      <div style={{ width: '350px', height: '600px' }}>
        <Chatroom chatroomId={chatroomId} />
      </div>
    </Provider>
  );
};

export default ChatroomApp;
```

## 如何自定义

### 修改主题

通过 Provider 组件的 theme props 来修改主题：

```javascript
import { Provider, Chatroom } from 'easemob-chat-uikit';

const ChatApp = () => {
  return (
    <Provider
      theme={{
        mode: 'light', // 'light' | 'dark'
        primaryColor: '#00CE76', // 主题色（十六进制颜色值）
      }}
    >
      <Chatroom className="customClass" prefix="custom" chatroomId="your-chatroom-id" />
    </Provider>
  );
};
```

### 修改组件样式

可以通过组件 props 传递 `className`、`style`、`prefix` 修改样式：

```javascript
import { Chatroom } from 'easemob-chat-uikit';

const ChatApp = () => {
  return (
    <div>
      <Chatroom
        className="customClass"
        prefix="custom"
        chatroomId="your-chatroom-id"
        style={{ width: '100%', height: '100vh' }}
      />
    </div>
  );
};
```

### 使用自定义组件

可以通过容器组件的 `renderX` 方法来渲染自定义组件，以自定义渲染 header 为例：

```javascript
import { Chatroom, Header } from 'easemob-chat-uikit';

const ChatApp = () => {
  const CustomHeader = <Header back content="自定义标题" />;
  return (
    <div>
      <Chatroom chatroomId="your-chatroom-id" renderHeader={roomInfo => CustomHeader} />
    </div>
  );
};
```

### 隐藏人员加入消息

聊天室中，当用户加入时会自动发送一条加入消息。如果你希望隐藏这些消息：

```javascript
import { Chatroom } from 'easemob-chat-uikit';
import { ChatSDK } from 'easemob-chat-uikit/module/SDK';
import ChatroomMessage from 'easemob-chat-uikit/module/chatroomMessage';

<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;
      // 隐藏加入消息
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null;
      }
      // 其他 custom 消息（如礼物）使用默认渲染
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

### 配置消息操作菜单

你可以通过 `messageActionConfig` 配置消息长按菜单：

```javascript
import { Chatroom } from 'easemob-chat-uikit';
import Icon from 'easemob-chat-uikit/component/icon';

<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    recall: true, // 撤回消息
    translate: true, // 翻译消息
    mute: true, // 禁言（仅群主可见）
    report: true, // 举报消息
    pin: true, // 置顶消息（仅群主可见）
    customActions: [
      {
        content: '复制',
        icon: <Icon type="COPY" width={16} height={16} />,
        onClick: message => {
          if (message.type === 'txt') {
            navigator.clipboard.writeText(message.msg);
          }
        },
      },
    ],
  }}
/>;
```

## 相关文档

- [聊天室页面介绍](./chatroom.md) - 详细的聊天室组件文档
- [登录文档](./login.md) - 登录相关配置
- [Provider 文档](./provider.md) - Provider 组件配置
