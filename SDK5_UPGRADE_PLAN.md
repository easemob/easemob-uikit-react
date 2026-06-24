# Easemob Web SDK 5.0 Upgrade Plan

本计划用于将当前 React UIKit 从旧版 `easemob-websdk@4.x` 升级到新版 SDK 5.0 架构。升级目标是彻底迁移到 SDK 5.0 原生 API 和原生数据模型，不把新 SDK 消息、会话、联系人、群组等数据转换成旧 SDK 字段格式。

## 目标

- 使用 SDK 5.0 的 `ChatClient` 和各 Manager 初始化、登录、收发消息、管理会话、联系人、群组、聊天室、Thread、Presence、Push 和用户资料。
- 全项目统一使用 SDK 5.0 原生类型和字段。
- 移除旧 SDK 的 `connection`、`chatSDK.message.create`、`conn.open`、`conn.send`、`conn.*Group*`、`conn.*ChatRoom*`、`conn.*Contact*` 等调用形态。
- 移除或废弃密码登录链路，因为 SDK 5.0 不再支持 `pwd` 登录。
- 更新 UIKit 内部 store、hooks、module 组件，使它们直接消费新版 `Message`、`Conversation`、Manager 返回值和事件。
- 保持对外 React 组件能力不退化，但允许内部类型和高级回调参数升级为 SDK 5.0 语义。

## 非目标

- 不做“新 SDK 数据转旧 SDK 数据”的兼容层。
- 不保留旧消息字段作为内部主模型，例如 `msg`、`mid`、`chatType`、`customEvent`、`customExts`、`length` 等。
- 不在一次改造里顺便做 UI 重构、样式重构或无关目录整理。
- 不为了兼容旧应用代码而长期保留旧 SDK API。必要时只提供迁移说明。

## 关键破坏性变化

### SDK 入口

旧版：

```ts
import WebIM from 'easemob-websdk';

const conn = new WebIM.connection({ appKey });
```

新版：

```ts
import {
  ChatClient,
  ChatManager,
  ContactManager,
  GroupManager,
  ChatRoomManager,
  PresenceManager,
  PushManager,
  UserInfoManager,
  ChatThreadManager,
} from 'easemob-websdk';

const client = ChatClient.init({
  appKey,
  managers: [
    ChatManager,
    ContactManager,
    GroupManager,
    ChatRoomManager,
    PresenceManager,
    PushManager,
    UserInfoManager,
    ChatThreadManager,
  ],
});
```

### 登录

旧版：

```ts
await conn.open({ user, accessToken });
await conn.open({ user, pwd });
```

新版：

```ts
await client.login({ userId, token });
```

密码登录已移除。`ProviderProps.initConfig.password` 应废弃或删除。

### 当前用户

旧版：

```ts
client.user
client.context.userId
```

新版：

```ts
client.getCurrentUserId()
```

### 消息模型

旧版常用字段：

- `id`
- `mid`
- `type: 'txt' | 'img' | 'audio' | 'loc' | 'custom' | 'cmd' | 'combine'`
- `msg`
- `to`
- `from`
- `chatType`
- `customEvent`
- `customExts`
- `length`
- `ext`

新版核心字段：

- `msgLocalId`
- `msgServerId`
- `type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'location' | 'custom' | 'cmd' | 'combine'`
- `body`
- `from`
- `to`
- `sender`
- `conversationId`
- `conversationType`
- `timestamp`
- `status`
- `direct`
- `ext`

组件和 store 必须直接改用新版字段。例如文本内容从 `message.msg` 改为 `message.body.content`，会话类型从 `message.chatType` 改为 `message.conversationType`。

### 消息创建与发送

旧版：

```ts
const msg = chatSDK.message.create({
  type: 'txt',
  to,
  chatType,
  msg: content,
});

await client.send(msg);
```

新版：

```ts
const message = client.chatManager.createTextMessage({
  conversationId,
  conversationType,
  content,
  ext,
});

await client.chatManager.sendMessage(message);
```

附件消息统一使用新版参数，例如 `data`、`duration`、`filename`、`thumbnailUrl` 等。

### 事件系统

旧版按消息类型拆事件：

- `onTextMessage`
- `onImageMessage`
- `onAudioMessage`
- `onCmdMessage`
- `onCustomMessage`

新版统一为：

- `onMessage(message)`

消息操作事件迁移：

- `onRecallMessage` -> `onMessageRecalled`
- `onModifiedMessage` -> `onMessageUpdated`
- `onReadMessage` -> `onMessageRead`
- `onChannelMessage` -> `onConversationRead`
- `onDeliveredMessage` -> `onMessageDelivered`
- `onMessagePinEvent` -> `onPinnedMessageChanged`
- `onReactionChange` -> `onReactionChanged`

群组和聊天室事件也要从 `onGroupEvent/onChatroomEvent + operation` 改为新版独立事件名。

## 推荐分期

### Phase 0: 准备与基线

1. 建立升级分支，例如 `upgrade/websdk-5`.
2. 记录当前基础功能基线：
   - 登录。
   - 会话列表加载。
   - 单聊文本消息收发。
   - 群聊文本消息收发。
   - 图片、语音、视频、文件消息。
   - 会话删除、置顶、免打扰。
   - 消息撤回、编辑、删除、翻译、Reaction、置顶。
   - 联系人、群组、聊天室、Thread、CallKit。
3. 先跑一次当前 `npm test` 和 `npm run build`，记录升级前失败项。
4. 确认 SDK 5.0 包来源：
   - 如果使用本地 websdk2，先明确 npm link、workspace、file dependency 或正式 npm 版本。
   - 确认 `easemob-websdk` 的导出包含 `ChatClient` 和所需 Manager。

验收：

- 有升级前测试/构建结果记录。
- 有基础功能手工验证清单。

### Phase 1: SDK 入口与 Provider

涉及文件：

- `package.json`
- `module/SDK.ts`
- `module/store/Provider.tsx`
- `module/store/index.ts`
- `module/store/rootContext.ts`
- `module/hooks/useClient.ts`
- `AGENTS.md`

任务：

1. 升级依赖到 SDK 5.0。
2. 重写 `module/SDK.ts`，导出 SDK 5.0 的 `ChatClient`、Manager 和类型。
3. 将 `RootStore.client` 类型从旧 `ChatSDK.Connection` 改为新版 `ChatClient` 带 Manager 的类型。
4. 在 `Provider` 中使用 `ChatClient.init({ appKey, managers })` 初始化。
5. 初始化参数迁移：
   - `delivery` -> `enableDeliveryReceipt`
   - `isFixedDeviceId` -> `useFixedDeviceId`
   - `useOwnUploadFun` -> `useCustomAttachmentUpload`
   - `useReplacedMessageContents` 保持。
   - `apiUrl/url` -> `serviceConfig.serverUrls.restApiUrl/wsUrl`
   - `uikitVersion` -> `uiKitVersion`
6. 登录逻辑从 `open` 改为 `login`。
7. 废弃 `password` 登录配置。
8. 替换项目中所有 `client.user` 和 `client.context.userId` 为 `client.getCurrentUserId()`。

验收：

- TypeScript 能识别新版 SDK 类型。
- `Provider` 能初始化 SDK 5.0。
- token 登录链路能触发 `onConnected`。

### Phase 2: 全局事件系统

涉及文件：

- `module/hooks/chat.ts`
- `eventHandler/index.ts`
- `module/store/MessageStore.ts`
- `module/store/ConversationStore.ts`
- `module/store/AddressStore.ts`
- `module/store/ThreadStore.ts`
- `module/store/PinnedMessagesStore.ts`

任务：

1. 重写 `useEventHandler` 中 SDK 事件注册。
2. 消息接收统一使用 `onMessage(message)`。
3. `messageStore.receiveMessage` 入参改为新版 `Message`。
4. 消息状态事件迁移：
   - delivered -> `onMessageDelivered`
   - read -> `onMessageRead`
   - conversation read -> `onConversationRead`
5. 消息操作事件迁移：
   - recall -> `onMessageRecalled`
   - modify -> `onMessageUpdated`
   - pin -> `onPinnedMessageChanged`
   - reaction -> `onReactionChanged`
6. 群组事件迁移为新版独立事件名。
7. 聊天室事件迁移为 `ChatRoomManager` 事件。
8. Thread 事件迁移为 `ChatThreadManager` 事件。
9. Presence 事件迁移为 `PresenceManager` 事件。

验收：

- 收到文本、图片、文件、语音、视频、cmd、custom、combine 消息时 store 使用新版 `Message` 存储。
- 撤回、编辑、Reaction、置顶事件能更新对应 store。
- 连接状态仍能正确更新 `rootStore.loginState`。

### Phase 3: 消息 Store 原生模型改造

涉及文件：

- `module/store/MessageStore.ts`
- `module/types/messageType.ts`
- `module/baseMessage/BaseMessage.tsx`
- `module/textMessage/TextMessage.tsx`
- `module/imageMessage/ImageMessage.tsx`
- `module/audioMessage/AudioMessage.tsx`
- `module/videoMessage/VideoMessage.tsx`
- `module/fileMessage/FileMessage.tsx`
- `module/combinedMessage/CombinedMessage.tsx`
- `module/repliedMessage/`
- `module/recalledMessage/`
- `module/messageStatus/`
- `module/chat/MessageList.tsx`
- `module/chatroomMessage/ChatroomMessage.tsx`

任务：

1. 将 `MessageStore.message`、`byId`、`selectedMessage` 等类型改为新版 `Message`。
2. 消息主键统一策略：
   - 本地发送中使用 `msgLocalId`。
   - 服务端确认后使用 `msgServerId` 作为服务端操作 ID。
   - store 可以保留 `byLocalId` 和 `byServerId` 两个索引，但数据对象必须是新版 `Message`。
3. 删除内部对 `mid/id/msg/chatType` 的依赖。
4. 文本消息渲染改为 `message.body.content`。
5. 图片消息渲染改为 `message.body.originalImageUrl`、`message.body.thumbnailUrl`、`message.body.width/height`。
6. 语音消息从 `audio` 改为 `voice`，时长使用 `message.body.duration`。
7. 自定义消息从 `customEvent/customExts` 改为 `message.body.event/params`。
8. 合并消息使用 `message.body.messageList/title/summary/compatibleText`。
9. 时间统一使用 `message.timestamp`。
10. 会话定位统一使用 `message.conversationId/message.conversationType`。
11. 自己发送判断统一使用 `message.direct === 'SEND'` 或 `message.sender.userId === client.getCurrentUserId()`。
12. 引用消息 `msgQuote` 结构如果仍是业务扩展，应重新定义为 SDK 5.0 消息字段语义。

验收：

- 各消息类型组件不再读取旧消息字段。
- `MessageStore` 不再依赖旧 SDK 消息类型。
- 消息收发和历史消息渲染都使用同一种新版模型。

### Phase 4: 消息发送链路

涉及文件：

- `module/messageInput/textarea/Textarea.tsx`
- `module/messageInput/moreAction/MoreAction.tsx`
- `module/messageInput/recorder/Recorder.tsx`
- `module/messageInput/gift/GiftKeyboard.tsx`
- `module/messageInput/selectedControls/SelectedControls.tsx`
- `module/store/MessageStore.ts`
- `module/textMessage/TextMessage.tsx`
- `module/chatroom/Chatroom.tsx`

任务：

1. 删除所有 `chatSDK.message.create(...)`。
2. 文本消息改为 `client.chatManager.createTextMessage(...)`。
3. 图片消息改为 `createImageMessage(...)`。
4. 文件消息改为 `createFileMessage(...)`。
5. 语音消息改为 `createVoiceMessage(...)`。
6. 视频消息改为 `createVideoMessage(...)`。
7. cmd 消息改为 `createCmdMessage(...)`。
8. 自定义消息改为 `createCustomMessage(...)`。
9. 合并转发改为 `createCombineMessage(...)`。
10. 发送统一使用 `client.chatManager.sendMessage(message, options)`。
11. 发送回包直接使用新版返回的完整 `Message` 更新 store。
12. 上传进度、定向消息、仅在线投递、优先级迁移到 `sendMessage` 第二参数。

验收：

- 文本、图片、语音、视频、文件、cmd、自定义、合并消息均可发送。
- 发送中、成功、失败状态正确。
- 不再出现 `chatSDK.message.create` 和 `client.send`。

### Phase 5: 会话列表和会话操作

涉及文件：

- `module/hooks/useConversation.ts`
- `module/store/ConversationStore.ts`
- `module/conversation/ConversationList.tsx`
- `module/conversation/ConversationItem.tsx`
- `module/chat/Chat.tsx`

任务：

1. `getServerConversations` 改为 `client.chatManager.getConversationList`。
2. 会话数据类型改为 SDK 5.0 的会话类型。
3. 字段迁移：
   - `conversationType` 替代 `chatType`
   - `unreadCount` 替代 `unReadCount`
   - `isPinned/pinnedTime` 使用新版返回字段
4. `deleteConversation` 改为 `client.chatManager.deleteConversation`。
5. 会话置顶改为 `client.chatManager.setConversationPinned`。
6. 会话已读改为 `client.chatManager.markConversationRead`。
7. 清空/删除历史消息改为 `client.chatManager.removeHistoryMessages`，参数使用 `conversationId/conversationType/beforeTimestamp/messageIds`。
8. 免打扰相关迁移到 `client.pushManager`。

验收：

- 会话列表加载、分页、搜索、点击、未读数、last message 正常。
- 删除、置顶、取消置顶、免打扰正常。

### Phase 6: 联系人、用户资料、Presence

涉及文件：

- `module/hooks/useAddress.ts`
- `module/store/AddressStore.ts`
- `module/contactList/`
- `module/userProfile/`
- `module/userCardMessage/`
- `module/utils/index.ts`

任务：

1. 联系人列表改为 `client.contactManager.getContacts()`。
2. 添加、删除、接受、拒绝联系人改为 `contactManager`。
3. 黑名单改为 `contactManager.getBlocklist/addUsersToBlocklist/removeUserFromBlocklist`。
4. 用户资料改为 `client.userInfoManager.getUserInfoByUserId`。
5. 订阅和查询在线状态改为 `client.presenceManager`。
6. 将 `appUsersInfo` 内部类型更新为新版用户资料字段。
7. 所有 presence 展示逻辑使用新版 presence 结果。

验收：

- 通讯录、用户资料、黑名单、在线状态展示正常。
- 不再调用旧 `fetchUserInfoById`、`getAllContacts`、`subscribePresence`。

### Phase 7: 群组

涉及文件：

- `module/hooks/useAddress.ts`
- `module/store/AddressStore.ts`
- `module/groupDetail/`
- `module/groupMember/`
- `module/contactList/ContactGroup.tsx`

任务：

1. 加入群组列表改为 `client.groupManager.getJoinedGroupList`。
2. 群详情改为 `client.groupManager.getGroupInfo` 或 `getGroup(groupId).refresh()`。
3. 群成员改为 `client.groupManager.getGroup(groupId).getMembers`。
4. 群管理员、禁言、转让、解散、退群、邀请、移除成员等都迁移到 `groupManager` 或 `groupManager.getGroup(groupId)`。
5. 群成员属性改为 `getGroup(groupId).setMemberAttributes/getMembersAttributes`。
6. 群组事件从旧 `operation` 分发迁移为新版独立事件名。

验收：

- 群列表、群详情、群成员、群设置和成员管理功能正常。

### Phase 8: 聊天室

涉及文件：

- `module/chatroom/`
- `module/chatroomMessage/`
- `module/chatroomMember/`
- `module/store/AddressStore.ts`

任务：

1. 加入聊天室改为 `client.chatRoomManager.joinChatRoom`。
2. 聊天室详情、成员、禁言、踢人等改为 `chatRoomManager` 或 `chatRoomManager.getChatRoom(chatRoomId)`。
3. 聊天室消息发送使用 `conversationType: 'chatRoom'`。
4. 聊天室自定义消息改为新版 `createCustomMessage({ event, params })`。
5. 聊天室事件迁移为新版独立事件名。
6. 聊天室置顶消息使用新版 `chatManager.pinMessage/unpinMessage/getPinnedMessageList`。

验收：

- 加入、退出、收发消息、成员列表、禁言、移除、礼物/自定义消息、置顶消息正常。

### Phase 9: Thread、Pinned Message、Reaction、Translation、Recall、Modify

涉及文件：

- `module/store/ThreadStore.ts`
- `module/thread/`
- `module/store/PinnedMessagesStore.ts`
- `module/pinnedMessage/`
- `module/pinnedTextMessage/`
- `module/reaction/`
- `module/textMessage/TextMessage.tsx`
- `module/chat/Chat.tsx`
- `module/chatroomMessage/ChatroomMessage.tsx`

任务：

1. Thread API 迁移到 `client.chatThreadManager`：
   - create
   - join
   - leave
   - destroy
   - get list
   - get detail
   - get members
   - remove member
2. 消息置顶迁移到 `client.chatManager.pinMessage/unpinMessage/getPinnedMessageList`。
3. Reaction 迁移到 `client.chatManager.addReaction/removeReaction/getReactionList/getReactionDetail`。
4. 翻译迁移到新版 `translateMessage` 参数。
5. 撤回迁移到 `client.chatManager.recallMessage`。
6. 编辑迁移到 `client.chatManager.modifyMessage`，新版内容使用 `Pick<Message, 'type' | 'body' | 'ext'>`。

验收：

- Thread、消息置顶、Reaction、翻译、撤回、编辑都能走新版 API。
- 对应事件能实时刷新 UI。

### Phase 10: CallKit

涉及文件：

- `module/callkit/`
- `module/callkit/services/CallService.ts`
- `module/callkit/types/`
- `demo/callkit/`
- `module/chat/Chat.tsx`

任务：

1. 删除 `CallService.ts` 里的旧 `import WebIM from 'easemob-websdk'`。
2. 呼叫邀请消息改为 `client.chatManager.createTextMessage` 或 `createCustomMessage`。
3. 所有 `connection.send(msg)` 改为 `client.chatManager.sendMessage(msg)`。
4. 呼叫控制扩展字段改用新版消息 `body/ext`。
5. 确认 SDK 5.0 RTC token 获取接口：
   - `client.getRTCTokenInfo`
   - `client.getUserIdsWithRTCUids`
6. 保持 Agora RTC SDK 逻辑独立，不和 IM SDK manager 混用。

验收：

- 单人音视频呼叫、群呼、接听、拒绝、取消、超时、忙线、挂断链路正常。
- CallKit 不再引用旧 WebIM message API。

### Phase 11: 文档、Demo、Storybook

涉及文件：

- `README.md`
- `docs/`
- `demo/`
- `module/**/*.stories.tsx`
- `AGENTS.md`

任务：

1. 更新 README 快速开始中的登录、Provider、消息发送示例。
2. 更新 docs 中所有 `open`、`accessToken`、`chatSDK.message.create`、`client.send` 示例。
3. 更新 CallKit docs。
4. 更新 demo 登录配置。
5. 更新 Storybook 示例中的消息 mock 数据为 SDK 5.0 模型。
6. 更新 `AGENTS.md`，明确项目已使用 SDK 5.0 原生模型。

验收：

- 文档中不再推荐旧 SDK API。
- demo 和 stories 使用新版消息字段。

### Phase 12: 类型收敛和清理

任务：

1. 全局搜索并清理旧 API：
   - `chatSDK.message.create`
   - `new .*connection`
   - `.open(`
   - `.send(`
   - `.getServerConversations`
   - `.fetchUserInfoById`
   - `.getAllContacts`
   - `.context.userId`
   - `.user`
   - `chatType`
   - `mid`
   - `msg`
   - `customEvent`
   - `customExts`
2. 对确实属于业务扩展字段的旧名，迁移成明确的新业务字段名。
3. 删除旧 SDK 类型别名和无效注释。
4. 收敛 `any` 和 `@ts-ignore`，优先使用 SDK 5.0 类型。

验收：

- 不再直接使用旧 SDK API。
- 旧消息字段不再作为内部主路径存在。
- TypeScript 类型错误数量降到可接受范围，最终应为 0。

## API 映射清单

| 旧 API / 字段 | 新 API / 字段 |
| --- | --- |
| `new SDK.connection({ appKey })` | `ChatClient.init({ appKey, managers })` |
| `conn.open({ user, accessToken })` | `client.login({ userId, token })` |
| `conn.close()` | `client.logout()` |
| `conn.user` | `client.getCurrentUserId()` |
| `conn.context.userId` | `client.getCurrentUserId()` |
| `chatSDK.message.create({ type: 'txt', msg })` | `client.chatManager.createTextMessage({ content })` |
| `chatSDK.message.create({ type: 'img' })` | `client.chatManager.createImageMessage(...)` |
| `chatSDK.message.create({ type: 'audio', length })` | `client.chatManager.createVoiceMessage({ duration })` |
| `chatSDK.message.create({ type: 'custom', customEvent, customExts })` | `client.chatManager.createCustomMessage({ event, params })` |
| `conn.send(message)` | `client.chatManager.sendMessage(message, options)` |
| `message.chatType` | `message.conversationType` |
| `message.to` for routing | `message.conversationId` |
| `message.msg` | `message.body.content` |
| `message.mid` | `message.msgServerId` |
| `message.id` | `message.msgLocalId` or `message.msgServerId` by use case |
| `message.time` | `message.timestamp` |
| `conn.getServerConversations` | `client.chatManager.getConversationList` |
| `conn.deleteConversation` | `client.chatManager.deleteConversation` |
| `conn.removeHistoryMessages` | `client.chatManager.removeHistoryMessages` |
| `conn.recallMessage` | `client.chatManager.recallMessage` |
| `conn.modifyMessage` | `client.chatManager.modifyMessage` |
| `conn.addReaction/deleteReaction` | `client.chatManager.addReaction/removeReaction` |
| `conn.getReactionDetail` | `client.chatManager.getReactionDetail` |
| `conn.getAllContacts` | `client.contactManager.getContacts()` |
| `conn.addContact` | `client.contactManager.addContact` |
| `conn.deleteContact` | `client.contactManager.deleteContact` |
| `conn.fetchUserInfoById` | `client.userInfoManager.getUserInfoByUserId` |
| `conn.getJoinedGroups` | `client.groupManager.getJoinedGroupList` |
| `conn.getGroupInfo` | `client.groupManager.getGroupInfo` |
| `conn.joinChatRoom` | `client.chatRoomManager.joinChatRoom` |
| `conn.publishPresence` | `client.presenceManager.publishPresence` |
| `conn.subscribePresence` | `client.presenceManager.subscribePresence` |
| `conn.setSilentModeForConversation` | `client.pushManager.setConversationSilentMode` |
| `conn.getSilentModeForConversations` | `client.pushManager.getConversationSilentModes` |
| `conn.createChatThread` | `client.chatThreadManager.createChatThread` |

## 验证矩阵

每个阶段至少执行：

- `npm test`
- `npm run build`
- 相关 demo 手动验证

核心手动验证：

- Provider token 登录。
- 单聊文本消息收发。
- 群聊文本消息收发。
- 图片、语音、视频、文件消息发送和展示。
- 历史消息加载。
- 会话列表、未读数、删除、置顶、免打扰。
- 消息撤回、编辑、删除、翻译、Reaction、置顶。
- 联系人、用户资料、Presence、黑名单。
- 群详情、成员、管理员、禁言、转让、解散、退群。
- 聊天室加入、收发、成员管理、置顶消息。
- Thread 创建、加入、成员、销毁。
- CallKit 呼叫链路。

## 风险

- 消息模型变更会影响几乎所有 message module，是最大风险。
- `client.user` 和 `client.context.userId` 使用点多，必须统一替换。
- 新 SDK 返回值从 `AsyncResult<T>` 变成直接 `T`，所有 `res.data` 读取都要检查。
- 旧密码登录不可用，可能影响 demo 或用户文档。
- CallKit 里旧 SDK 调用多，建议单独迁移和验收。
- Storybook/demo mock 数据需要同步更新，否则视觉验证会失真。

## 建议 PR 拆分

1. SDK 初始化、Provider、RootStore 类型。
2. 事件系统和 MessageStore 新模型。
3. 消息输入和所有消息渲染组件。
4. 会话列表和会话操作。
5. 联系人、用户资料、Presence、黑名单。
6. 群组。
7. 聊天室。
8. Thread、Pinned、Reaction、Translation、Recall、Modify。
9. CallKit。
10. Docs、demo、stories、清理旧 API。

每个 PR 都应保证类型检查和构建尽量可运行；如果中间阶段无法完整运行，需要在 PR 描述里明确临时不可用模块。
