# Easemob UIKit for React

![Static Badge](https://img.shields.io/badge/platform-React-green) ![Static Badge](https://img.shields.io/badge/language-typescript-green) ![GitHub commit activity](https://img.shields.io/github/commit-activity/y/easemob/Easemob-UIKit-web) ![GitHub last commit](https://img.shields.io/github/last-commit/easemob/Easemob-UIKit-web) ![GitHub Issues or Pull Requests](https://img.shields.io/github/issues/easemob/Easemob-UIKit-web) ![GitHub License](https://img.shields.io/github/license/easemob/Easemob-UIKit-web) ![GitHub Tag](https://img.shields.io/github/v/tag/easemob/Easemob-UIKit-web) ![NPM Version](https://img.shields.io/npm/v/easemob-chat-uikit)

本文将介绍环信新单群聊 UIKit。新单群聊 UIKit 致力于为开发者提供高效集成、即插即用、高自由度定制化的 UI 组件库，助力构建功能全面、设计美观的 IM 应用，轻松满足即时通信绝大多数场景。请下载示例进行体验。

## 📌 目录

- [简介](#📖-简介)
- [技术原理](#⚙️-技术原理)
- [功能](#✨-功能)
- [组件](#🧩-组件)
- [运行示例 App](#🖥-运行示例-app)
- [快速开始](#🔨-快速开始)
- [进阶指南](#🌈-进阶指南)
- [项目结构](#🏠-项目结构)
- [参考文档](#🔗-参考文档)
- [相关资源](#📁-相关资源)

## 📖 简介

Easemob UIKit for WEB 是集开发工具包与用户界面于一体的开发利器，全面的即插即用的 UI 组件将助力您轻松快速地将标准聊天功能集成到新旧客户端应用中。从会话列表到消息体等核心功能，从整体主题到颜色字体等细节样式，组件均可完全定制，打造契合您品牌标识的独特应用内聊天体验。

特别注意：UIKit 支持单聊、群聊、客服、问诊、AI 陪聊等绝大多数聊天场景。

## ⚙️ 技术原理

UIKIt 由三部分组成：UI 组件，管理数据的 mobx store, chat SDK。UI 组件包含容器组件 container 复合组件 module, 以及纯 UI 组件 components, 这些不同级别的组件全部对外暴露，用户可以引用任意组件构建自己的应用。UIkit 使用 mobx 管理全局数据，用户可以引用 rootStore 来获得全部数据和 action 方法，可以用 action 方法来操作数据。 UIKit 内部集成了 chat SDK，通过 chat SDK 和服务器交互。<div align=center> <img src="https://github.com/easemob/Easemob-UIKit-web/blob/main/docs/image/uikit.png" width = "400" height = "450" /></div>

## ✨ 功能

`easemob-chat-uikit` 库提供以下功能：

- 聊天界面，支持各种类型消息，和对消息的操作，音视频通话；
- 会话列表，支持搜索、删除、指定、免打扰；
- 通讯录，按首字母排序；
- 群组管理，支持修改群信息，添加删除群成员；
- 自动布局，适配容器的宽高；
- 定制化 UI。

- 支持的消息类型： 文本、表情、语音、图片、视频、文件、名片、合并消息。
- 消息支持的操作：回复、删除、撤回、翻译、编辑、多选、转发、举报、固定。

## 🧩 组件

`easemob-chat-uikit` 目前提供容器组件、模块组件、纯 UI 组件三个级别的组件，组件详情可以查看[故事书](https://storybook.easemob.com/)

## 🖥 运行示例 App

1. 安装依赖

```bash
npm install
```

2. 运行项目

```bash
npm run dev
```

3. 选择 demo 目录下的示例 demo 打开，如：http://localhost:5173/demo/module/chat/index.html

## 🔨 快速开始

### 前提条件

开启 Easemob Chat 服务前，请确保已经具备以下要素：

- React 16.8.0 或以上版本；
- React DOM 16.8.0 或以上版本；
- Easemob Chat 项目和 App Key。

### 支持的浏览器

| 浏览器    | 支持的版本 |
| --------- | ---------- |
| IE 浏览器 | 11 或以上  |
| Edge      | 43 或以上  |
| Firefox   | 10 或以上  |
| Chrome    | 54 或以上  |
| Safari    | 11 或以上  |

### UIKit 中用到的服务

- 会话列表
- 漫游消息
- 单向删除漫游消息
- 用户属性
- 翻译
- 举报
- 黑名单
- 用户在线状态
- 消息置顶
- 会话置顶
- 消息撤回
- 消息表情回复
- 子区

如果用到这些功能，请确保相关服务是开通的。

### 使用步骤

#### 1.创建 chat-uikit 项目

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

#### 2.集成 easemob-chat-uikit

##### 安装 easemob-chat-uikit

- 通过 npm 安装，运行以下命令：

```bash
npm install easemob-chat-uikit --save
```

- 通过 yarn 安装，运行以下命令：

```bash
yarn add easemob-chat-uikit
```

##### 使用 easemob-chat-uikit 组件构建应用

将 easemob-chat-uikit 库导入你的代码中：

```javascript
// App.js
import React, { Component, useEffect } from 'react';
import { Provider, Chat, ConversationList, useClient, rootStore } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const ChatApp = () => {
  const client = useClient();
  useEffect(() => {
    client &&
      client
        .open({
          user: '',
          accessToken: '',
        })
        .then(res => {
          console.log('get token success', res);
          // create a conversation
          rootStore.conversationStore.addConversation({
            chatType: '', // 'singleChat' || 'groupChat'
            conversationId: '', // target user id or group id
            name: '', // target user nickname or group name
          });
        });
  }, [client]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '350px' }}>
        <ConversationList />
      </div>
      <div style={{ flex: '1' }}>
        <Chat />
      </div>
    </div>
  );
};

class App extends Component {
  render() {
    return (
      <Provider
        initConfig={{
          appKey: 'your app key',
        }}
      >
        <ChatApp />
      </Provider>
    );
  }
}

export default App;
```

##### 运行项目并发送你的第一条消息

```bash
npm run start
```

在浏览器可看到你的应用。

<div align=center style="background: #ddd; padding-top: 8px"> <img src="https://github.com/easemob/Easemob-UIKit-web/blob/main/docs/image/chat.png" width = "480" height = "350" /></div>

在默认 App Key 情况下，为方便快速体验，我们默认支持几种类型的消息下发。点击选中一个成员后，输入你的第一条消息并发送。

**注意** 使用自定义 App Key 时，由于没有联系人，需先添加好友

## 🌈 进阶指南

### 修改组件样式

可以通过组件 props 传递 className, style, prefix 修改样式

```javascript
import { Chat, Button } from 'easemob-chat-uikit';

const ChatApp = () => {
  return (
    <div>
      <Chat className="customClass" prefix="custom" />
      <Button style={{ width: '100px' }}>Button</Button>
    </div>
  );
};
```

### 使用自定义组件

可以通过容器组件的 renderX 方法来渲染自定义组件

```javascript
import {Chat, Header} from 'easemob-chat-uikit'

const ChatApp = () => {
  const CustomHeader = <Header back content="Custom Header">
  return(
    <div>
      <Chat renderHeader={(cvs) => CustomHeader}>
    </div>
  )
}

```

### 修改主题

1. UIKit 提供了一些全局主题配置项：

```typescript
theme: {
    primaryColor?: string | number; // 16进制颜色值，或者Hue值
    mode?: 'light' | 'dark'; // 明暗主题
    avatarShape?: 'circle' | 'square'; // 头像圆形还是方形
    bubbleShape?: 'ground' | 'square'; // 消息气泡大圆角还是小圆角
    componentsShape?: 'ground' | 'square'; // 搜索，输入框，按钮组件 大圆角还是小圆角
};
```

使用示例

```jsx
<UIKitProvider
  theme={{
    primaryColor: 203,
    mode: 'light',
  }}
>
  {/** ... */}
</UIKitProvider>
```

2. UIKit 样式使用 scss 框架开发，定义了一系列全局样式变量，包括但不限于全局样式（主色、背景色、圆角、边框、字体大小）。

```scss
// need to use hsla
$blue-base: hsla(203, 100%, 60%, 1);
$green-base: hsla(155, 100%, 60%, 1);
$red-base: hsla(350, 100%, 60%, 1);
$gray-base: hsla(203, 8%, 60%, 1);
$special-base: hsla(220, 36%, 60%, 1);

$font-color: $gray-3;
$title-color: $gray-1;
$component-background: #fff;

$height-base: 36px;
$height-lg: 48px;
$height-sm: 28px;

// vertical margins
$margin-lg: 24px;
$margin-md: 16px;
$margin-sm: 12px;
$margin-xs: 8px;
$margin-xss: 4px;

// vertical paddings
$padding-lg: 24px;
$padding-md: 20px;
$padding-sm: 16px;
$padding-s: 12px;
$padding-xs: 8px;
$padding-xss: 4px;
// font
$font-size-base: 14px;
$font-size-lg: $font-size-base + 2px;
$font-size-sm: 12px;
$text-color: fade($black, 85%);
```

使用 webpack 进行变量覆盖：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              additionalData: `@import "@/styles/index.scss";`,
            },
          },
        ],
      },
    ],
  },
};
```

如果这些不能满足定制化要求，还可以检查元素来覆盖 UIKit 的样式。

## 🏠 项目结构

```
easemob-uikit-web
├── build // 打包后的产物
├── common // 公共样式
├── component // 纯UI组件
├── demo // 示例demo
├── docs // 文档
├── eventHandler // 时间监听器
├── local // 国际化文案
└── module // 容器和模块组件
   ├── baseMessage // 消息基础组件，其他类型的消息组件都是在这个组件上宽展
   ├── chat // Chat 组件，包含整个聊天页面
   ├── contactList // 联系人组件
   ├── conversation // 会话列表组件
   ├── store // 全局状态
   └── utils // 工具方法
```

## 👥 社区贡献者

如果你认为可将一些功能添加到 UIKit 中让更多用户受益，请随时 Fork 存储库并添加拉取请求。如果你在使用上有任何问题，也请在存储库上提交。感谢你的贡献！

## 🔗 参考文档

[其他相关文档](https://github.com/easemob/Easemob-UIKit-web/tree/main/docs/zh)

## 📁 相关资源

[集成文档](https://docs-im-beta.easemob.com/document/web/quickstart.html);

[chat demo 线上地址](https://webim-h5.easemob.com/) [chat demo 源码地址](https://github.com/easemob/webim/tree/dev_4.0?tab=readme-ov-file)

[chatroom demo 线上地址](https://webim-live.easemob.com/) [chatroom demo 源码地址](https://github.com/easemob/ChatroomDemo/tree/dev/WEB/ChatroomDemo)；

## 📄 代码许可

示例项目遵守 MIT 许可证。
