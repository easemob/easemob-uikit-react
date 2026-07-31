# 场景 FAQ

本文覆盖接入 UIKit（尤其 SDK 5）后的高频业务问题。构建/运行时报错见 [故障排查](./troubleshooting.md)。

## 会话有头像，但消息 sender 没有？

常见原因：

1. 会话列表用了 `providers.userInfo` / 联系人备注 / 群资料，但消息气泡仍读 `message.sender` 或未触发用户资料补齐。
2. `initConfig.useUserInfo` 与 `providers.userInfo` 混用策略不一致。
3. 历史消息里的 `sender` 摘要为空，且未对 `from` 做二次解析。

处理建议：

- 统一通过 `providers.userInfo` 提供业务昵称头像
- 确认消息所在会话类型会触发 userInfo 拉取（会话列表、消息列表、群成员路径并不完全相同）
- 详见 [头像昵称](./userInfo.md) 与 [业务数据接入](./business-data.md)

## 联系人为空？

检查：

1. 是否已登录成功（`rootStore.loginState === true`）
2. `initConfig.enableSyncData` 是否包含 `'contact'`（默认通常包含）
3. 是否监听/等待 `onSyncDataFinished` 后 contact 同步完成
4. 业务方是否自己清空了 `addressStore.contacts`

若关闭了 sync，需要自行调用联系人相关 API 并写入 store。

## 同步失败 / 会话列表不更新？

检查：

1. 网络与 token 是否有效
2. `enableSyncData` 是否包含 `'conversation'` / `'group'` / `'contact'`
3. 控制台是否有 SDK 同步错误
4. 是否错误地依赖了内部路径或旧会话字段（`channel_id`、`unread_num` 等）

会话列表推荐以 `ConversationList` 或 `client.chatManager.getConversationList()` 的 SDK 5 `ConversationItem` 为准：`conversationId`、`conversationType`、`unreadCount`。

## 未读点击后消失，重新登录又回来？

点击会话时，UIKit 会：

1. **立刻**把本地 `conversationStore` 的 `unreadCount` 置 0（乐观更新）
2. 调用 `chatManager.clearConversationUnreadMessageCount(...)` 清服务端/SDK 未读

如果第 2 步失败，本地看起来已读，但重登后会从服务端会话同步把未读拉回来。

排查：

1. 打开控制台，查找 `[UIKit] clearConversationUnreadMessageCount failed...`
2. 常见错误码：`201` 未登录、`300` 未连接、`110` 参数非法
3. 确认 `conversationType` 为 `singleChat` 或 `groupChat`
4. 若 Promise 成功但重登仍恢复，属于 SDK/服务端未读持久化问题，需结合 websdk2 与服务端日志继续查

详见 [SDK 5 迁移指南 - 会话未读清零](./sdk5-migration.md#4-会话未读清零)。

## 为什么不能 `import ... from '.../module/store/xxx'`？

公共兼容承诺只覆盖：

- `easemob-chat-uikit`
- `easemob-chat-uikit/module`
- `easemob-chat-uikit/component`
- `easemob-chat-uikit/style.css`

内部路径可随时重构。正确做法见 [三种接入模式](./integration-modes.md)。Store 公共/内部边界将在 `uikit-public-store-api` 中进一步收紧。

## 消息状态图标不对（一直已发送、没有已读）？

确认：

1. 发送方消息创建时设置了 `needReadReceipt: true`（群聊尤其需要）
2. 接收方打开会话或触发了 `sendMessageReadReceipts`
3. 发送方监听/处理了 `onMessageReadReceipts`（UIKit 已内置处理）
4. UI 使用 `sendStatus` + `isPeerRead` / `groupReadCount`，或 `getMessageDisplayStatus`，不要再读写旧的混合 `status`

## 密码登录还能用吗？

不能。请改用 token 登录。见 [SDK 5 迁移指南](./sdk5-migration.md#1-登录与初始化)。

## 首次 render 调用 client 为什么报 `is not a function`？

常见错误包括：

```text
rootStore.client.getCurrentUserId is not a function
rootStore.client.chatManager is undefined
```

`rootStore.client` 初始是空对象，Provider 挂载后的 effect 才会写入真实 SDK 实例。
子组件首次 render 早于这个 effect，因此不能直接读取它。

React 组件应从 Context 获取 client：

```tsx
import React from 'react';
import { RootContext, rootStore } from 'easemob-chat-uikit';

function UserPanel() {
  const { client, initConfig } = React.useContext(RootContext);
  const userId = client.getCurrentUserId() || initConfig.userId || '';

  const updateNickname = async () => {
    if (!rootStore.loginState) return;
    await client.userInfoManager.updateOwnInfo({ nickname: 'Alice' });
  };

  return <button onClick={updateNickname}>{userId}</button>;
}
```

详见 [Provider - Client 与登录时序](./provider.md#client-与登录时序)。

## 当前用户 ID 应该从哪里取？

- 登录前业务已经知道的 ID：业务登录状态或 `RootContext.initConfig.userId`
- SDK 登录完成后的当前 IM 用户：`client.getCurrentUserId()`
- 昵称、头像等展示数据：优先由 `providers.userInfo` 提供

不要再使用 SDK 4 的 `rootStore.client.user` 或内部 `client.context.userId`。

## 修改昵称或头像为什么提示 API 不存在？

SDK 5 将用户资料能力放到了 `userInfoManager`：

```ts
await client.userInfoManager.updateOwnInfo({
  nickname: 'Alice',
  avatarUrl: 'https://example.com/avatar.png',
});
```

不要使用已移除的 `client.updateUserInfo()` 或 `client.updateOwnUserInfo()`。
