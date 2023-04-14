# Agora Chat UIKit Web 使用指南

## 简介

agora-chat-uikit 是基于声网 IM SDK 的一款 UI 组件库，提供通用的 UI 组件，和包含业务逻辑的 module，包括聊天、会话、搜索、通讯录等 module 组件，这些组件允许用户自定义和使用通用 UI 组件来自定义更小级别的子组件，agora-chat-uikit 提供 provider 来管理数据，provider 自动监听 SDK 事件，来更新数据，并驱动 UI 更新。开发者可根据实际业务需求利用该库快速搭建自定义 IM 应用。

`agora-chat-uikit` 目前有 5 个模块组件：

`Provider` Provider 不渲染任何 UI, 只为组件提供全局上下文，自动监听 SDK 事件，向下传递数据，驱动组件渲染

`Chat` 聊天组件

`ConversationList` 会话列表组件

`ContactList` 通讯录组件

`UserProfile` 个人信息组件

`agora-chat-uikit` 库提供以下功能：

-   自动布局会话框高度及宽度；
-   传入必选参数内部实现自动登录；
-   实现收发消息、消息上屏、消息未读数、消息类型（文本、图片、文件、表情、音频、视频消息）；
-   会话搜索；
-   定制化 UI。

Agora 在 GitHub 上提供一个开源的 AgoraChat-UIKit-web 项目，你可以克隆和运行该项目或参考其中的逻辑创建项目集成 agora-chat-uikit。

-   [Agora Chat UIKit Web 源代码 URL](https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web)
-   [利用 agora-chat-uikit 的声网 IM 应用的 URL](https://github.com/AgoraIO-Usecase/AgoraChat-web)

## 前提条件

开启 Agora Chat 服务前，请确保已经具备以下要素：

-   React 16.8.0 或以上版本；
-   React DOM 16.8.0 或以上版本；
-   有效的 Agora Chat 开发者账号；
-   Agora Chat 项目和 App Key。

## 支持的浏览器

| 浏览器    | 支持的版本 |
| --------- | ---------- |
| IE 浏览器 | 11 或以上  |
| Edge      | 43 或以上  |
| Firefox   | 10 或以上  |
| Chrome    | 54 或以上  |
| Safari    | 11 或以上  |

## 操作步骤

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

### 2.集成 agora-chat-uikit

#### 安装 agora-chat-uikit

-   通过 npm 安装，运行以下命令：

```bash
npm install agora-chat-uikit --save
```

-   通过 yarn 安装，运行以下命令：

```bash
yarn add agora-chat-uikit
```

#### 使用 agora-chat-uikit 组件构建应用

将 agora-chat-uikit 库导入你的代码中：

```javascript
// App.js
import React, { Component } from 'react';
import {
	Provider,
	Chat,
	ConversationList,
	ContactList,
} from 'agora-chat-uikit';
import './App.scss';

class App extends Component {
	render() {
		return (
			<Provider
				init={
					((appkey = 'xxx'), // 你注册的 App Key。
					(username = 'xxx'), // 当前登录的用户 ID。
					(agoraToken = 'xxx')) // 声网 token。关于如何获取声网 token 下文有介绍。
				}
			>
				<div>
					<ConversationList />
				</div>
				<div>
					<Chat />
				</div>
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

在默认 App Key 情况下，我们默认支持几种类型的消息下发，方便快速体验。点击选中一个成员后，输入你的第一条消息并发送。

**注意**
使用自定义 App Key 时，由于没有联系人，需先[添加好友](https://docs-preprod.agora.io/cn/agora-chat/agora_chat_relationship_web?platform=Web#申请添加好友)或[加入群组](https://docs-preprod.agora.io/cn/agora-chat/agora_chat_group_web?platform=Web#用户申请入群与退出群组)。

## 自定义功能和 UI

### 如何修改 UI

UIKit 样式使用 scss 框架开发，定义了一系列全局样式变量，包括但不限于全局样式（主色、背景色、圆角、边框、字体大小）。

```scss
// vertical paddings
$padding-lg: 24px; // containers
$padding-md: 20px; // small containers and buttons
$padding-sm: 16px; // Form controls and items
$padding-s: 12px; // small items
$padding-xs: 8px; // small items
$padding-xss: 4px; // more small
// font
$font-size-base: 14px;
$font-size-lg: $font-size-base + 2px;
$font-size-sm: $font-size-base - 2px;

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

如果这些不能满足定制化要求，可以在使用组件的时候传入 class 前缀 `prefix`，或者 `className`。 这允许你修改原 class 类名，来使用自己的 class，使用 className 可以增加自己的 css 属性来覆盖原 class。

### 定制功能

`agora-chat-uikit` 提供的组件提供各种 render 方法，来支持自定义渲染 dom，如自定义实现会话列表 header

```jsx

<ContactList
    renderHeader= () => <MyCustomHeader/>
>
</ContactList>
```

在自定义组件中使用应用数据：用户可以在 Provider 中拿到应用的全部数据。

```js
import { useStateContext } from 'agora-chat-uikit';
const { store } = useStateContext();
```

## 社区贡献者

如果你认为可将一些功能添加到 EaseChat 中让更多用户受益，请随时 Fork 存储库并添加拉取请求。如果你在使用上有任何问题，也请在存储库上提交。感谢你的贡献！

## 参考文档

-   [Agora Chat SDK 产品概述](https://docs-preprod.agora.io/en/agora-chat/agora_chat_overview?platform=Web)
-   [Agora Chat SDK API 参考](https://docs-preprod.agora.io/en/agora-chat/API%20Reference/im_ts/index.html?transId=4dbea540-f2cd-11ec-bafe-3fe630a7aac4)

## 相关资源

-   你可以先参阅 [常见问题](https://docs.agora.io/cn/faq)
-   如果你想了解更多官方示例，可以参考 [官方 SDK 示例](https://github.com/AgoraIO)
-   如果你想了解声网 SDK 在复杂场景下的应用，可以参考 [官方场景案例](https://github.com/AgoraIO-usecase)
-   如果你想了解声网的一些社区开发者维护的项目，可以查看 [社区](https://github.com/AgoraIO-Community)
-   若遇到问题需要开发者帮助，你可以到 [开发者社区](https://rtcdeveloper.com/) 提问
-   如果需要售后技术支持, 你可以在 [Agora Dashboard](https://dashboard.agora.io) 提交工单

## 代码许可

示例项目遵守 MIT 许可证。
