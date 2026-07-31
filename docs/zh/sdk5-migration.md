# SDK 5 迁移指南

本指南面向 UIKit 集成方，说明从旧 SDK / 旧字段迁移到 SDK 5 原生模型时需要改什么。内部迁移笔记见 OpenSpec archive；对外请以本文为准。

相关文档：

- [Foundation Quickstart](./foundation-quickstart.md)
- [三种接入模式](./integration-modes.md)
- [FAQ](./faq.md)

## 1. 登录与初始化

| 旧用法 | SDK 5 / 当前 UIKit |
|--------|---------------------|
| `password` 登录 | **不再支持**；使用 `token` |
| `new SDK.connection` / `conn.open` | `Provider` 内部 `ChatClient.init` + `client.login({ userId, token })` |
| 直接 `conn.send` | `client.chatManager.sendMessage(message)` |

推荐：

```tsx
<Provider
  initConfig={{
    appKey: 'org#app',
    userId: 'user1',
    token: 'user_token',
  }}
>
  <App />
</Provider>
```

### 1.1 获取 client 与判断可用状态

Provider 子树内优先从 `RootContext` 获取 client：

```tsx
import React from 'react';
import { RootContext, rootStore } from 'easemob-chat-uikit';

function Actions() {
  const { client, initConfig } = React.useContext(RootContext);

  const currentUserId = client.getCurrentUserId(); // 登录前为 null
  const canCallServer = rootStore.loginState;

  return <span>{currentUserId || initConfig.userId || (canCallServer ? '已连接' : '未登录')}</span>;
}
```

`RootContext.client` 在 Provider 首次 render 时已经创建；`rootStore.client` 要到 Provider
effect 执行后才会赋值。因此业务组件不要在首次 render 直接调用
`rootStore.client.getCurrentUserId()` 或访问 Manager。需要联网的 API 还应等待
`rootStore.loginState === true`。

## 2. 消息字段对照

| 旧字段 / 习惯 | SDK 5 字段 |
|---------------|------------|
| `id` / `mid` | `msgLocalId` / `msgServerId` |
| `chatType` | `conversationType` |
| `to` 兼会话路由 | `conversationId` + `conversationType` |
| `time` | `timestamp` |
| `msg`（文本） | `body.content` |
| `customEvent` / `customExts` | `body.event` / `body.params` |
| `bySelf` | `direct === 'SEND'` 或用 UIKit helper |
| `status` 混发送/送达/已读 | 拆开，见下一节 |

UIKit 内部使用以下兼容读取 helper：

- `getMessageId`
- `getMessageTime`
- `getMessageChatType`
- `getTextContent`
- `isMessageFromCurrentUser`
- `getMessageDisplayStatus`

这些 helper 目前不是公共导出。集成方应优先读取 SDK 5 原生字段，并通过
`client.getCurrentUserId()` 获取当前用户，不要依赖 `module/utils/*` 等内部路径。

不要把 SDK 5 消息再转换回 4.x 形状作为主模型。

## 3. 发送状态与已读状态

SDK 0.20+ 起：

| 概念 | 字段 / 事件 |
|------|-------------|
| 发送中 / 已发送 / 失败 | `sendStatus`: `sending` \| `sent` \| `failed` |
| 单聊对端已读 | `isPeerRead` |
| 群聊累计已读人数 | `groupReadCount` |
| 是否请求已读回执 | 创建消息时设 `needReadReceipt: true`（chatRoom 不支持） |
| 送达 | `onMessageDelivered`（需开启 `enableDeliveryReceipt`；UIKit Provider 默认开启） |
| 已读回执事件 | `onMessageReadReceipts` |

UI 展示可使用 `getMessageDisplayStatus(message)`，它会综合 `sendStatus`、`isPeerRead`、`groupReadCount` 与送达标记。

## 4. 会话未读清零

| 旧用法 | 新用法 |
|--------|--------|
| `markConversationRead` / channel ack 给对端 | `clearConversationUnreadMessageCount` |
| 期望对端收到会话已读事件 | **不会通知对端**；只清自己的未读，并多端同步 |

```ts
await rootStore.client.chatManager.clearConversationUnreadMessageCount({
  conversationId: 'user2',
  conversationType: 'singleChat',
});
```

UIKit 点击会话时会调用该方法。若本地未读先消失、重新登录又回来，通常是服务端清未读未成功，见 [FAQ](./faq.md#未读点击后消失重新登录又回来)。

清空全部未读：

```ts
await rootStore.client.chatManager.clearAllConversationUnreadMessageCount();
```

## 5. 消息已读回执

| 旧用法 | 新用法 |
|--------|--------|
| `markMessageRead({ messages })` | `sendMessageReadReceipts({ conversationId, conversationType, messageIds })` |
| `onMessageRead` / `onConversationRead` | `onMessageReadReceipts`（payload 始终是数组） |

```ts
await rootStore.client.chatManager.sendMessageReadReceipts({
  conversationId: message.conversationId,
  conversationType: message.conversationType, // singleChat | groupChat
  messageIds: [message.msgServerId],
});
```

说明：

- 同一会话一次最多 50 条 `messageIds`
- 本地调用方不会收到自己的 `onMessageReadReceipts`
- 群聊已读需控制台开通；创建消息时建议 `needReadReceipt: true`

UIKit 打开会话时会批量发送已读回执；媒体消息播放/下载时也会发送。

## 6. Manager API 方向

优先使用 SDK managers，而不是旧 connection 方法：

- 消息 / 会话：`client.chatManager`
- 联系人：`client.contactManager`
- 群组：`client.groupManager`
- 聊天室：`client.chatRoomManager`
- 用户资料：`client.userInfoManager`
- 在线状态：`client.presenceManager`
- Thread：`client.chatThreadManager`
- 推送免打扰：`client.pushManager`

常见调用示例：

```ts
const myUserId = client.getCurrentUserId();

const message = client.chatManager.createTextMessage({
  conversationId: 'user2',
  conversationType: 'singleChat',
  content: 'hello',
});
await client.chatManager.sendMessage(message);

const contacts = client.contactManager.getContacts();
await client.userInfoManager.updateOwnInfo({ nickname: 'Alice' });
await client.logout();
```

SDK 5 的能力按 Manager 划分。不要继续调用已移除的顶层 API，例如
`client.updateUserInfo()`、`client.updateOwnUserInfo()` 或 `client.close()`。

## 7. 迁移检查清单

1. 登录只保留 `token`
2. 所有消息读写改用 SDK 5 字段或 UIKit helper
3. 自定义消息改用 `body.event` / `body.params`
4. 未读清零改用 `clearConversationUnreadMessageCount`
5. 已读回执改用 `sendMessageReadReceipts` / `onMessageReadReceipts`
6. 删除对 `module/store/*` 等内部路径的依赖
7. 跑通：登录 → 会话列表 → 单聊/群聊收发 → 未读清零 → 已读状态
