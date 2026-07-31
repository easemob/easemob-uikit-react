# 业务数据接入

业务侧通常要接管头像昵称、群资料、自定义消息，以及文件上传/审核等能力。本文说明当前推荐做法与已知缺口。

相关文档：

- [UIKitProvider](./provider.md)
- [头像昵称](./userInfo.md)
- [三种接入模式](./integration-modes.md)
- [FAQ](./faq.md)

## 1. 用户资料：`providers.userInfo`

推荐在 `Provider` 上配置业务用户资料，而不是到处手动 `setAppUserInfo`。

```tsx
<Provider
  initConfig={{
    appKey,
    userId,
    token,
    useUserInfo: false, // 若完全使用业务资料，可关闭 SDK 用户属性拉取
  }}
  providers={{
    userInfo: async userIds => {
      const users = await fetchUsersFromYourBackend(userIds);
      return users.map(user => ({
        userId: user.id,
        nickname: user.name,
        avatarUrl: user.avatar,
      }));
    },
  }}
>
  <App />
</Provider>
```

也支持返回以 `userId` 为 key 的对象。旧 prop `userInfoProvider` 仍兼容，新代码请用 `providers.userInfo`。

细节与三种资料来源对比见 [头像昵称](./userInfo.md)。

## 2. 群资料：`providers.groupInfo`

```tsx
providers={{
  groupInfo: async groupIds => {
    const groups = await fetchGroupsFromYourBackend(groupIds);
    return groups.map(group => ({
      groupId: group.id,
      groupName: group.name,
      groupAvatar: group.avatar,
    }));
  },
}}
```

CallKit / 会话列表等会在需要展示群名头像时调用该 provider。

## 3. 自定义消息

### 发送（SDK 5）

```ts
import { rootStore } from 'easemob-chat-uikit';

const message = rootStore.client.chatManager.createCustomMessage({
  conversationId: 'user2',
  conversationType: 'singleChat',
  event: 'orderCard',
  params: {
    orderId: 'A1001',
    title: '订单卡片',
  },
  needReadReceipt: true,
});

rootStore.messageStore.sendMessage(message);
```

字段对应关系：

- 旧 `customEvent` → `body.event`
- 旧 `customExts` → `body.params`

### 渲染

在 `Chat` / `MessageList` 上使用自定义消息渲染覆盖（如 `renderMessage` 或按类型的 render 配置，具体 props 见聊天模块文档），根据 `message.body.event` 分支：

```tsx
function renderCustomMessage(message) {
  if (message.body?.event === 'orderCard') {
    return <OrderCard params={message.body.params} />;
  }
  return null; // 返回 null 时走默认渲染
}
```

## 4. 文件上传

当前状态：

- 默认由 SDK / UIKit 内置附件上传路径发送图片、文件、语音、视频。
- Provider `initConfig.useOwnUploadFun`（SDK：`useCustomAttachmentUpload`）用于启用自定义上传适配；**统一的 `providers.fileUpload` 合同尚未作为稳定公共 API 文档化**。
- 若业务必须自建上传，请先评估 SDK 自定义上传能力，并关注后续 `uikit-public-store-api` / Provider 合同收紧。

## 5. 权限 / 黑名单 / 审核

当前状态：

- 黑名单：可通过通讯录 / blocklist 相关模块与 store 能力使用（详见联系人文档）。
- 内容审核、敏感词、业务权限系统：**没有单独的 UIKit Provider 合同**；通常由业务后端或消息 `ext` / 自定义消息承载。
- 若需要在发送前拦截，可使用消息输入相关的 `onBeforeSendMessage`（SDK 5 draft/message 合同），不要再改旧的 `to/chatType` 可变字段。

## 6. 推荐接入顺序

1. 先用完整页面模式跑通登录与收发
2. 接入 `providers.userInfo` / `providers.groupInfo`
3. 再加自定义消息渲染
4. 最后处理上传/审核等业务特有能力
