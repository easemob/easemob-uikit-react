# CallKit 集成指南

本文档详细介绍如何在你的 React 项目中集成和使用环信 CallKit，实现完整的音视频通话功能。

<ImageGallery>
  <ImageItem src="/images/callkit/web/1v1_video_caller_invitation.png" title="一对一通话邀请" />
  <ImageItem src="/images/callkit/web/group_call_ongoing.png" title="群组通话" />
</ImageGallery>

## 推荐环境

- Node.js: 18.0 及以上
- npm: 9.0 及以上 或 yarn: 1.22 及以上
- React: 18.0 及以上
- TypeScript: 4.9 及以上
- Vite: 4.0 及以上
- IM SDK 4.16.0 及以上或 UIKit 2.0.0 及以上
- 现代浏览器: Chrome/Firefox/Safari/Edge 最新版本

## 前提条件

在集成 CallKit 之前，你需要完成以下准备工作：

1. 在 [环信控制台](https://console.easemob.com/user/login) 进行如下操作：

- [注册环信账号](/product/console/account_register.html#注册账号)。
- [创建应用](/product/console/app_create.html)，[获取应用的 App Key](/product/console/app_manage.html#获取应用凭证)，格式为 `orgname#appname`。
- [创建用户](/product/console/operation_user.html#创建用户)，获取用户 ID。
- [创建群组](/product/console/operation_group.html#创建群组)，获取群组 ID。将用户加入群组。
- [开通音视频服务](product_activation.html)。

2. 集成环信即时通讯 IM SDK。

确保已集成环信 IM SDK 并完成登录。

## 集成步骤

### 步骤 1 安装与引入 CallKit

#### 1. 安装依赖

```bash
npm install easemob-chat-uikit
# 或
yarn add easemob-chat-uikit
```

#### 2. 导入样式

```tsx
import "easemob-chat-uikit/style.css";
```

#### 3. 引入 CallKit

```tsx
import { CallKit, Provider, rootStore } from "easemob-chat-uikit";
import type { CallKitRef } from "easemob-chat-uikit";
```

### 步骤 2 配置 CallKit 组件

在你的应用根组件中，需要使用 `Provider` 组件包裹整个应用，并在其中使用 `CallKit` 组件：

```tsx
import React, { useRef } from "react";
import { Provider, CallKit, rootStore } from "easemob-chat-uikit";
import type { CallKitRef } from "easemob-chat-uikit";
import "easemob-chat-uikit/style.css";

const App = () => {
  const callKitRef = useRef<CallKitRef>(null);

  // 用户信息提供者
  const userInfoProvider = async (userIds: string[]) => {
    return userIds.map((userId) => ({
      userId,
      nickname: `用户 ${userId}`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    }));
  };

  // 群组信息提供者
  const groupInfoProvider = async (groupIds: string[]) => {
    return groupIds.map((groupId) => ({
      groupId,
      groupName: `群组 ${groupId}`,
      groupAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=group-${groupId}`,
    }));
  };

  return (
    <Provider
      initConfig={{
        appKey: "your_app_key", // 你的应用 App Key
        userId: "current_user_id", // 当前用户 ID
        token: "user_token", // 用户 token，或使用 password 进行密码登录
      }}
    >
      <CallKit
        ref={callKitRef}
        chatClient={rootStore.client} // 环信 IM 客户端实例
        userInfoProvider={userInfoProvider} // 用户信息提供者
        groupInfoProvider={groupInfoProvider} // 群组信息提供者
        enableRingtone={true} // 启用铃声
        resizable={true} // 允许调整大小
        draggable={true} // 允许拖拽
      />
    </Provider>
  );
};

export default App;
```

CallKit 组件或重要配置的说明如下：

| 组件/属性           | 说明   |
| :-------------- | :----- |
| Provider 组件            | - 负责初始化环信 IM SDK 连接，必须包裹在应用的最外层。<br/> - 该组件会自动处理 IM SDK 的初始化和登录。|
| initConfig 配置            | 包含应用的 App Key、用户 ID 和登录凭证（Token）。  |
| CallKit 组件            | - 音视频通话组件，会自动处理内部的初始化逻辑。<br/> - 该组件会在内部自动初始化音视频服务，无需手动调用初始化方法。  |
| chatClient 属性            | 传入 `rootStore.client`，即 Provider 创建的 IM 连接实例。  |
| 信息提供者            | `userInfoProvider` 和 `groupInfoProvider` 用于获取用户和群组的显示信息。   |


### 步骤 3 登录 IM

CallKit 内部依赖 IM SDK 进行信令交互，所以在使用 CallKit 之前需要先登录 IM。登录 IM 有两种方式可以选择：

1. 使用 UIKit：UIKit Provider 组件内集成了 IM SDK，提供 `userId` 和 `token` 属性，内部会自动登录。

```tsx
import React, { useRef } from "react";
import { Provider, CallKit, rootStore } from "easemob-chat-uikit";
import type { CallKitRef } from "easemob-chat-uikit";
import "easemob-chat-uikit/style.css";

const App = () => {
  const callKitRef = useRef<CallKitRef>(null);
  return (
    <Provider
      initConfig={{
        appKey: "your_app_key", // 你的应用 App Key
        userId: "current_user_id", // 当前用户 ID
        token: "user_token", // 用户 token
      }}
    >
      <CallKit
        ref={callKitRef}
        chatClient={rootStore.client} // 环信 IM 客户端实例
        enableRingtone={true} // 启用铃声
        resizable={true} // 允许调整大小
        draggable={true} // 允许拖拽
      />
    </Provider>
  );
};

export default App;
```

若手动登录，可以从 `rootStore` 获取 IM SDK 实例，调用 SDK 的 `open` 方法登录。

```tsx
import React, { useRef, useEffect } from "react";
import { Provider, CallKit, rootStore } from "easemob-chat-uikit";
import type { CallKitRef } from "easemob-chat-uikit";
import "easemob-chat-uikit/style.css";

const App = () => {
  const callKitRef = useRef<CallKitRef>(null);

  useEffect(() => {
    // 手动登录
    rootStore.client.open({
      user: "userId",
      accessToken: "accessToken",
    });
  }, []);

  return (
    <Provider
      initConfig={{
        appKey: "your_app_key", // 你的应用 App Key
      }}
    >
      <CallKit
        ref={callKitRef}
        chatClient={rootStore.client} // 环信 IM 客户端实例
        enableRingtone={true} // 启用铃声
        resizable={true} // 允许调整大小
        draggable={true} // 允许拖拽
      />
    </Provider>
  );
};

export default App;
```

2. 如果不使用 UIKit Provider, 只使用 CallKit 组件，可自行集成 IM SDK 并处理登录。

```tsx
import React, { useRef } from "react";
import { CallKit } from "easemob-chat-uikit";
import type { CallKitRef } from "easemob-chat-uikit";
import ChatSDK from "easemob-websdk";
import "easemob-chat-uikit/style.css";

const App = () => {
  const callKitRef = useRef<CallKitRef>(null);
  const [chatClient, setChatClient] = useState(null);

  useEffect(() => {
    const chat = new ChatSDK.connection({
      appKey: "your appKey",
    });

    chat.open({
      user: "userId",
      accessToken: "accessToken",
    });
    setChatClient(chat);
  }, []);
  return (
    <CallKit
      ref={callKitRef}
      chatClient={chatClient} // 环信 IM 客户端实例
      enableRingtone={true} // 启用铃声
      resizable={true} // 允许调整大小
      draggable={true} // 允许拖拽
    />
  );
};

export default App;
```

### 步骤 4 配置监听器

CallKit 组件可以设置回调事件，实现监听 CallKit 内部状态和错误事件。

```tsx
<CallKit
  ref={callKitRef} // CallKit 组件引用，用于调用组件方法
  // === 事件回调 ===
  onCallError={(error) => {}}
  onEndCallWithReason={(reason) => {}}
/>
```

回调事件说明如下表所示：

| 回调事件              | 参数                                            | 描述                                             |
| --------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `onCallError`         | `(error: CallError)`                            | 通话过程中发生错误时触发，包含错误类型和详细信息 |
| `onReceivedCall`      | `(callType, userId, ext)`                       | 收到通话邀请时触发                               |
| `onCallStart`         | `(videos: VideoWindowProps[])`                  | 通话开始时触发                                   |
| `onEndCallWithReason` | `(reason: string, callInfo: CallInfo)`          | 通话结束原因回调                                 |
| `onRemoteUserJoined`  | `(userId: string, callType)`                    | 远程用户加入通话时触发                           |
| `onRemoteUserLeft`    | `(userId: string, callType)`                    | 远程用户离开通话时触发                           |
| `onInvitationAccept`  | `(invitation: InvitationInfo)`                  | 用户接受邀请时触发                               |
| `onInvitationReject`  | `(invitation: InvitationInfo)`                  | 用户拒绝邀请时触发                               |
| `onLayoutModeChange`  | `(layoutMode: string)`                          | 布局模式变化时触发                               |
| `onMinimizedChange`   | `(minimized: boolean)`                          | 最小化状态变化时触发                             |
| `onResize`            | `(width, height, deltaX?, deltaY?, direction?)` | 窗口大小调整时触发                               |
| `onDragStart`         | `(startPosition: {x, y})`                       | 开始拖拽时触发                                   |
| `onDrag`              | `(newPosition: {x, y}, delta: {x, y})`          | 拖拽过程中触发                                   |
| `onDragEnd`           | `(finalPosition: {x, y})`                       | 拖拽结束时触发                                   |
| `onRtcEngineCreated`  | `(rtc: any)`                                    | RTC 引擎创建完成时触发，可用于自定义配置         |
| `onAddParticipant`    | `()`                                            | 用户点击添加参与者按钮时触发                     |

### 步骤 5 发起通话

#### 发起一对一通话

你可以使用 `startSingleCall` 方法发起一对一通话，`callType` 设置为 `video` 为视频通话，`audio` 为音频通话。

```tsx
const App = () => {
  const callKitRef = useRef<CallKitRef>(null);
  // 一对一视频通话
  const startVideoCall = () => {
    callKitRef.current?.startSingleCall({
      to: "target_user_id",
      callType: "video",
      msg: "邀请你进行视频通话",
    });
  };

  // 一对一语音通话
  const startAudioCall = () => {
    callKitRef.current?.startSingleCall({
      to: "target_user_id",
      callType: "audio",
      msg: "邀请你进行语音通话",
    });
  };
  return (
    <Provider
      initConfig={{
        appKey: "your appKey",
        userId: "userId",
        token: "token",
      }}
    >
      <CallKit ref={callKitRef} chatClient={rootStore.client} />
    </Provider>
  );
};
```

<ImageGallery>
  <ImageItem src="/images/callkit/web/1v1_video_caller_invitation.png" title="视频通话" />
  <ImageItem src="/images/callkit/web/1v1_voice_caller_invitation.png" title="音频通话" />
</ImageGallery>

#### 发起群组通话

- **创建群组**：要发起群组通话，你需要首先创建群组，在群组中添加用户，详见 [环信控制台文档](/product/console/operation_group.html#创建群组)。
- **发起群组通话**：你可以使用 `startGroupCall` 发起群组通话，指定群组 ID，`callType` 设置为 `video` 为视频通话，`audio` 为音频通话，并设置邀请消息 `msg`。CallKit 会自动拉起群成员选择界面，界面显示群组中的所有成员（群主、管理员、普通成员），用户可以选择要邀请的成员，选中人数会实时显示。为了保证通话质量和性能，CallKit 限制群组通话最多支持 **16 人** 同时参与（包括发起者）。
- **通话中邀请他人**：群组通话中，当前用户可以点击通话界面右上角的邀请按钮向其他用户发起邀请。

```tsx
// 群组通话
const startGroupCall = () => {
  callKitRef.current?.startGroupCall({
    groupId: "group_id",
    callType: "video",
    msg: "邀请加入群组视频通话",
  });
};
```

<ImageGallery>
  <ImageItem src="/images/callkit/web/group_call_caller_user_selection.png" title="主叫选择用户进入通话" />
</ImageGallery>

### 步骤 6 接听通话

当接收到通话邀请时，CallKit 会自动触发 `onReceivedCall` 回调：
1. 弹出通话邀请界面。
2. 播放来电铃声。
3. 显示通话邀请通知。

被叫用户可选择接听、拒绝或挂断通话。

<ImageGallery :columns="2">
  <ImageItem src="/images/callkit/web/1v1_video_callee_invitation.png" title="一对一视频通话" />
  <ImageItem src="/images/callkit/web/1v1_voice_callee_invitation.png" title="一对一音频通话" />
  <ImageItem src="/images/callkit/web/group_call_callee_invitation.png" title="群组通话" />
</ImageGallery>

## 高阶功能

### 用户信息

- 默认情况下，音视频通话中显示用户 ID 和默认头像，你可以通过 `userInfoProvider` 设置用户昵称和头像。
- 默认情况下，群组音视频通话中显示群组 ID 和默认群组头像，你可以通过 `groupInfoProvider` 设置群组名称和群组头像。

```tsx
// 实现用户信息提供者
const userInfoProvider = async (userIds: string[]) => {
  // 从你的服务器或本地缓存获取用户信息
  return userIds.map((userId) => ({
    userId,
    nickname: `用户 ${userId}`,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
  }));
};
// 实现群组信息提供者
const groupInfoProvider = async (groupIds: string[]) => {
  // 从你的服务器或本地缓存获取群组信息
  return groupIds.map((groupId) => ({
    groupId,
    groupName: `群组 ${groupId}`,
    groupAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=group-${groupId}`,
  }));
};
```

### 用户信息缓存

通话过程中，优先使用缓存中的用户信息。若缓存中没有用户信息，你可以去服务器获取。

```tsx
const userInfoCache = new Map();

const userInfoProvider = async (userIds: string[]) => {
  const uncachedIds = userIds.filter((id) => !userInfoCache.has(id));

  if (uncachedIds.length > 0) {
    // 只请求未缓存的用户信息
    const newUserInfos = await fetchUserInfoFromServer(uncachedIds);
    newUserInfos.forEach((info) => {
      userInfoCache.set(info.userId, info);
    });
  }

  return userIds.map((id) => userInfoCache.get(id));
};
```

### 组件卸载时清理缓存数据

CallKit 组件卸载时需要清理缓存数据。

```tsx
useEffect(() => {
  return () => {
    // 组件卸载时结束通话
    callKitRef.current?.exitCall();
  };
}, []);
```
