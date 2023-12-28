# Easemob Chat UIKit Web 使用指南

## 简介

easemob-chat-uikit 是基于环信 Chat SDK 的一款 UI 组件库，提供通用的 UI 组件，和包含聊天业务逻辑的 module 组件，以及可以完整使用的容器组件， 容器组件允许用户使用 renderX 方法来进行自定义。easemob-chat-uikit 提供 provider 来管理数据，provider 自动监听 SDK 事件，来更新数据，并驱动 UI 更新。开发者可根据实际业务需求利用该库快速搭建自定义 IM 应用。

## 技术原理

UIKIt 由三部分组成：UI 组件，管理数据的 mobx store, chat SDK。UI 组件包含容器组件 container 复合组件 module, 以及纯 UI 组件 components, 这些不同级别的组件全部对外暴露，用户可以引用任意组件构建自己的应用。UIkit 使用 mobx 管理全局数据，用户可以引用 rootStore 来获得全部数据和 action 方法，可以用 action 方法来操作数据。 UIKit 内部集成了 chat SDK，通过 chat SDK 和服务器交互。<div align=center> <img src="https://github.com/easemob/Easemob-UIKit-web/blob/main/docs/image/uikit.png" width = "400" height = "450" /></div>

## 功能

`easemob-chat-uikit` 库提供以下功能：

- 自动布局，适配容器的宽高；
- 实现收发消息、消息上屏、消息未读数、清空消息、消息类型包括：（文本、图片、文件、表情、音频、视频消息）；
- 搜索，删除会话；
- 定制化 UI。

<table>
    <tr>
        <td>模块</td>
        <td>功能</td>
        <td>说明</td>
    </tr>
   <tr>
      <td rowspan="5" style=font-weight:bold>会话列表</td>
   </tr>
   <tr>
      <td>会话列表</td>
      <td style=font-size:10px>会话列表显示头像、昵称、最新消息内容、未读消息提醒和时间</td>
   </tr>
   <tr>
      <td>删除会话</td>
      <td style=font-size:10px>将会话从会话列表中删除</td>
   </tr>
   <tr>
      <td>免打扰</td>
      <td style=font-size:10px>开启消息免打扰或关闭消息免打扰</td>
   </tr>
   <tr>
      <td>置顶</td>
      <td style=font-size:10px>将会话固定在列表顶部</td>
   </tr>
    <tr>
      <td rowspan="6" style=font-weight:bold>聊天</td>
   </tr>
   <tr>
      <td>消息发送器</td>
      <td style=font-size:10px>支持发送文本 表情 图片 文件 语音</td>
   </tr>
   <tr>
      <td>消息展示</td>
      <td style=font-size:10px>单、群聊消息展示，包括头像、昵称、消息内容、时间、发送状态、已读状态，消息包括：文本、表情、图片、视频、文件、语音</td>
   </tr>
   <tr>
      <td>撤回消息</td>
      <td style=font-size:10px>已发出的消息默认 2 分钟内可撤回</td>
   </tr>
   <tr>
      <td>reaction</td>
      <td style=font-size:10px>对消息回复自定义表情</td>
   </tr>
   <tr>
      <td>名片</td>
      <td style=font-size:10px>点击头像显示好友名片，可以发送好友的个人名片信息</td>
   </tr>
   <tr>
   <td colspan="3">
     更多功能开发中 ...
	 </td>
   </tr>

</table>

## 组件

`easemob-chat-uikit` 目前提供的组件：

- 容器组件：`Provider`， `Chat`，`ConversationList`；
- module 组件：`BaseMessage`，`AudioMessage`，`FileMessage`， `VideoMessage`，`ImageMessage`，`TextMessage`，`Header`，`Empty`，`MessageList`， `ConversationItem`，`MessageInput`，`MessageStatus`；
- 纯 UI 组件：`Avatar`，`Badge`，`Button`，`Checkbox`，`Icon`，`Modal`，`Tooltip`

容器组件介绍

<table>
    <tr>
        <td>组件</td>
        <td>描述</td>
        <td>参数</td>
		<td>参数描述</td>
    </tr> 
   <tr>
      <td rowspan="2" style=font-weight:bold>Provider</td>
      <td rowspan="2"  style=font-size:10px>Provider 不渲染任何UI, 只为组件提供全局上下文，自动监听SDK事件，向下传递数据，驱动组件渲染</td>
      <td style=font-size:10px>
      initConfig: {
        appkey: string
      }
      </td>
	  <td style=font-size:10px>可以配置 appKey</td>
	   <tr>
	   <td style=font-size:10px>
	   </pre>
       local
		<pre>
      </td>
	   <td style=font-size:10px>配置本地化文案，具体参见 i18next init方法的参数</td>
	   </tr>
   </tr>
   <tr>
      <td rowspan="8" style=font-weight:bold>ConversationList</td>
      <td rowspan="8"  style=font-size:10px>会话列表组件</td>
      <td style=font-size:10px>
      className
	  </td>
	  <td style=font-size:10px>
	  组件类名
	  </td>
	  <tr>
		<td style=font-size:10px>prefix</td>
		<td style=font-size:10px>css 类名前缀</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>headerProps</td>
		<td style=font-size:10px>Header组件的props</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>itemProps</td>
		<td style=font-size:10px>ConversationItem组件的props</td>
	  </tr>
	   <tr>
		<td style=font-size:10px>renderHeader?: () => React.ReactNode</td>
		<td style=font-size:10px>自定义渲染 header, 该参数接收一个函数，这个函数返回一个react 节点</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>renderSearch?: () => React.ReactNode</td>
		<td style=font-size:10px>自定义渲染搜索组件, 该参数接收一个函数，这个函数返回一个react 节点</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>onItemClick?: (data: ConversationData[0]) => void</td>
		<td style=font-size:10px>点击会话事件，返回当前会话的数据</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => boolean</td>
		<td style=font-size:10px>搜索框change事件，如果函数返回false会阻止默认搜索行为，用户可自行按条件搜索</td>
	  </tr>
   </tr>
   <tr>
      <td rowspan="9" style=font-weight:bold>Chat</td>
      <td rowspan="9" style=font-size:10px>聊天组件</td>
      <td style=font-size:10px>
	  className: string
	  </td>
	  <td style=font-size:10px>
	  组件 css 类名
	  </td>
	  <tr>
	    <td style=font-size:10px>prefix: string</td>
		<td style=font-size:10px>css 类名前缀</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>headerProps: HeaderProps</td>
		<td style=font-size:10px>Header组件的props</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>messageListProps: MsgListProps</td>
		<td style=font-size:10px>MessageList组件的props</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>messageInputProps: MessageInputProps</td>
		<td style=font-size:10px>messageInput组件的props</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>renderHeader: (cvs: CurrentCvs) => React.ReactNode</td>
		<td style=font-size:10px>自定义渲染Header组件, 该参数接收一个函数，这个函数返回一个react 节点, CurrentCvs 为当前会话</td>
	  </tr>
	   <tr>
	    <td style=font-size:10px>renderMessageList?: () => ReactNode; </td>
		<td style=font-size:10px>自定义渲染消息列表组件</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>renderMessageInput?: () => ReactNode; </td>
		<td style=font-size:10px>自定义渲染消息发送器组件</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>renderEmpty?: () => ReactNode; </td>
		<td style=font-size:10px>自定义渲染没有会话时的空页面</td>
	  </tr>
   </tr>
</table>

## store

UIKit 提供了一个包含全部数据的 rootStore, rootStore 包含:

- initConfig：UIKit 初始化数据
- client：Chat SDK 实例
- conversationStore: 会话列表相关数据
- messageStore： 消息相关数据
- addressStore：通讯录相关数据

<table>
    <tr>
        <td>store</td>
        <td>属性/方法</td>
        <td>说明</td>
    </tr> 
    <tr>
      <td rowspan="10" >conversationStore</td>
    </<tr>
    <tr>
        <td>currentCvs</td>
        <td style=font-size:10px>当前的会话</td>
    </tr> 
    <tr>
        <td>conversationList</td>
        <td style=font-size:10px>全部会话</td>
    </tr> 
    <tr>
        <td>searchList</td>
        <td style=font-size:10px>搜索出来的会话</td>
    </tr> 
   <tr>
        <td style=color:blue>setCurrentCvs</td>
        <td style=font-size:10px>设置当前的会话</td>
    </tr> 
    <tr>
        <td style=color:blue>setConversation</td>
        <td style=font-size:10px>设置全部的会话</td>
    </tr> 
    <tr>
        <td style=color:blue>deleteConversation</td>
        <td style=font-size:10px>删除会话</td>
    </tr> 
   <tr>
        <td style=color:blue>addConversation</td>
        <td style=font-size:10px>添加一个会话</td>
    </tr> 
    <tr>
        <td style=color:blue>topConversation</td>
        <td style=font-size:10px>置顶一个会话</td>
    </tr> 
    <tr>
        <td style=color:blue>modifyConversation</td>
        <td style=font-size:10px>修改一个会话</td>
    </tr>
     <tr>
      <td rowspan="10" >messageStore</td>
    </tr>
   <tr>
        <td>message</td>
        <td style=font-size:10px>全部会话的消息，里面包含singleChat, groupChat, byId</td style=font-size:10px>
    </tr>
   <tr>
        <td style=color:blue>currentCvsMsgs</td>
        <td style=font-size:10px>设置当前会话的消息</td>
    </tr>
    <tr>
        <td style=color:blue>sendMessage</td>
        <td style=font-size:10px>发送一条消息</td>
    </tr>
    <tr>
        <td style=color:blue>receiveMessage</td>
        <td style=font-size:10px>接收一条消息</td>
    </tr>
    <tr>
        <td style=color:blue>modifyMessage</td>
        <td style=font-size:10px>编辑一条消息</td>
    </tr>
    <tr>
        <td style=color:blue>sendChannelAck</td>
        <td style=font-size:10px>回复一条channel ack, 清空会话中的未读数</td>
    </tr>
   <tr>
        <td style=color:blue>updateMessageStatus</td>
        <td style=font-size:10px>更新消息状态</td>
    </tr>
     <tr>
        <td style=color:blue>clearMessage</td>
        <td style=font-size:10px>清空一个会话的消息</td>
    </tr>
    
</table>

## 前提条件

开启 Easemob Chat 服务前，请确保已经具备以下要素：

- React 16.8.0 或以上版本；
- React DOM 16.8.0 或以上版本；
- Easemob Chat 项目和 App Key。

## 支持的浏览器

| 浏览器    | 支持的版本 |
| --------- | ---------- |
| IE 浏览器 | 11 或以上  |
| Edge      | 43 或以上  |
| Firefox   | 10 或以上  |
| Chrome    | 54 或以上  |
| Safari    | 11 或以上  |

## UIKit 中用到的服务

- 会话列表
- 漫游消息
- 单向删除漫游消息
- 用户属性

## 使用步骤

### 1.创建 chat-uikit 项目

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

### 2.集成 easemob-chat-uikit

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
import { Provider, Chat, ConversationList, useClient, rootStore } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const ChatApp = () => {
  const client = useClient();
  useEffect(() => {
    client &&
      client
        .open({
          user: '',
          token: '',
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
    <div>
      <div>
        <ConversationList />
      </div>
      <div>
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
          appKey: 'you app key',
        }}
      >
        <ChatApp />
      </Provider>
    );
  }
}

export default App;
```

#### 运行项目并发送你的第一条消息

```bash
npm run start
```

在浏览器可看到你的应用。

<div align=center style="background: #ddd; padding-top: 8px"> <img src="https://github.com/easemob/Easemob-UIKit-web/blob/main/docs/image/chat.png" width = "480" height = "350" /></div>

在默认 App Key 情况下，为方便快速体验，我们默认支持几种类型的消息下发。点击选中一个成员后，输入你的第一条消息并发送。

**注意** 使用自定义 App Key 时，由于没有联系人，需先添加好友

## 如何自定义

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

UIKit 样式使用 scss 框架开发，定义了一系列全局样式变量，包括但不限于全局样式（主色、背景色、圆角、边框、字体大小）。

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

```json
module.exports = {
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              additionalData: `@import "@/styles/index.scss";`
            },
          },
        ],
      },
    ],
  },
};
```

如果这些不能满足定制化要求，还可以检查元素来覆盖 UIKit 的样式。

## 社区贡献者

如果你认为可将一些功能添加到 UIKit 中让更多用户受益，请随时 Fork 存储库并添加拉取请求。如果你在使用上有任何问题，也请在存储库上提交。感谢你的贡献！

## 参考文档

[其他相关文档](https://github.com/easemob/Easemob-UIKit-web/tree/main/docs/zh)

## 相关资源

[集成文档](https://docs-im-beta.easemob.com/document/web/quickstart.html);

[chatroom demo 源码地址](https://github.com/easemob/ChatroomDemo/tree/dev/WEB/ChatroomDemo)；

[chatroom demo](https://livestream-hsb.oss-cn-beijing.aliyuncs.com/index.html)

## 代码许可

示例项目遵守 MIT 许可证。
