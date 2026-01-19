# rootStore

UIKit 使用 MobX 来管理全局数据。你可以通过 `rootStore` 获取所有数据和操作方法，用于修改数据并实现 UI 更新。

## 使用方式

UIKit 提供了两种使用方式：

### 方式一：直接使用 rootStore

在 React 组件外部或需要直接访问 store 的场景下，可以直接导入 `rootStore`：

```jsx
import { rootStore } from 'easemob-chat-uikit';

// 直接访问数据
const conversations = rootStore.conversationStore.conversationList;
const currentCvs = rootStore.conversationStore.currentCvs;

// 调用方法
rootStore.conversationStore.setCurrentCvs({
  chatType: 'singleChat',
  conversationId: 'userId',
});
```

### 方式二：使用自定义 Hooks（推荐在 React 组件内使用）

在 React 组件内部，推荐使用提供的自定义 Hooks，它们会自动处理 MobX 响应式更新：

- `useChatContext()` - 消息相关操作
- `useConversationContext()` - 会话相关操作
- `useAddressContext()` - 通讯录相关操作
- `useChatroomContext()` - 聊天室相关操作
- `useThreadContext()` - 话题相关操作

```jsx
import { useChatContext, useConversationContext } from 'easemob-chat-uikit';

const MyComponent = () => {
  const { messages, sendMessage, recallMessage } = useChatContext();
  const { conversationList, setCurrentConversation } = useConversationContext();

  // 使用这些方法和数据
};
```

**注意**：使用 Hooks 时，数据会自动响应式更新，组件会在数据变化时自动重新渲染。

## 使用示例

### 示例 1：置顶会话

```jsx
import React from 'react';
import { rootStore } from 'easemob-chat-uikit';

const StoreUseCase = () => {
  const pinConversation = () => {
    rootStore.conversationStore.pinConversation(
      'singleChat',
      'userId',
      true, // isPinned
    );
  };

  return (
    <div>
      <button onClick={pinConversation}>置顶会话</button>
    </div>
  );
};
```

### 示例 2：发送自定义消息

```jsx
import React from 'react';
import { rootStore, chatSDK } from 'easemob-chat-uikit';

const StoreUseCase = () => {
  const sendCustomMsg = () => {
    const customMsg = chatSDK.message.create({
      type: 'custom',
      to: 'targetId', // 单聊时为目标用户 ID，群聊时为群组 ID
      chatType: 'singleChat',
      customEvent: 'CARD',
      customExts: {
        id: 'userId3',
      },
    });
    rootStore.messageStore.sendMessage(customMsg).then(() => {
      console.log('发送成功');
    });
  };

  return (
    <div>
      <button onClick={sendCustomMsg}>发送自定义消息</button>
    </div>
  );
};
```

### 示例 3：使用 Hooks 发送消息

```jsx
import React from 'react';
import { useChatContext } from 'easemob-chat-uikit';
import { chatSDK } from 'easemob-chat-uikit';

const MyComponent = () => {
  const { sendMessage } = useChatContext();

  const handleSend = () => {
    const textMsg = chatSDK.message.create({
      type: 'txt',
      to: 'targetId',
      chatType: 'singleChat',
      msg: 'Hello',
    });
    sendMessage(textMsg);
  };

  return <button onClick={handleSend}>发送消息</button>;
};
```

## rootStore 结构概览

`rootStore` 包含以下子 Store：

- `conversationStore` - 会话管理
- `messageStore` - 消息管理
- `addressStore` - 通讯录管理（联系人、群组、聊天室）
- `threadStore` - 话题管理
- `pinnedMessagesStore` - 置顶消息管理
- `client` - SDK 客户端实例
- `loginState` - 登录状态
- `initConfig` - 初始化配置

## conversationStore

会话管理 Store，用于管理会话列表和当前会话。

### 数据属性

| 属性                  | 类型                  | 描述                     |
| :-------------------- | :-------------------- | :----------------------- |
| `currentCvs`          | `CurrentConversation` | 当前会话信息             |
| `conversationList`    | `Conversation[]`      | 所有会话列表             |
| `searchList`          | `Conversation[]`      | 搜索结果会话列表         |
| `hasConversationNext` | `boolean`             | 是否还有更多会话（分页） |
| `byId`                | `ById`                | 按 ID 索引的会话映射     |

### 对外方法

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `setCurrentCvs` | `(currentCvs: CurrentConversation) => void` | 设置当前会话，会自动发送已读回执 |
| `deleteConversation` | `(conversation: CurrentConversation) => void` | 删除会话（仅本地删除） |
| `addConversation` | `(conversation: Conversation) => void` | 添加会话到列表 |
| `modifyConversation` | `(conversation: Conversation) => void` | 修改会话信息 |
| `getConversation` | `(chatType: ChatType, cvsId: string) => Conversation \| undefined` | 根据类型和 ID 获取会话 |
| `pinConversation` | `(chatType: ChatType, cvsId: string, isPinned: boolean) => Promise<void>` | 置顶/取消置顶会话（调用 SDK API） |
| `getServerPinnedConversations` | `() => Promise<void>` | 获取服务器端置顶的会话列表（调用 SDK API） |

### 使用示例

```jsx
import { rootStore } from 'easemob-chat-uikit';

// 设置当前会话
rootStore.conversationStore.setCurrentCvs({
  chatType: 'singleChat',
  conversationId: 'userId',
  name: '用户名',
});

// 获取会话
const conversation = rootStore.conversationStore.getConversation('singleChat', 'userId');

// 置顶会话
rootStore.conversationStore.pinConversation('singleChat', 'userId', true);
```

## messageStore

消息管理 Store，用于管理消息的发送、接收、修改等操作。

### 数据属性

| 属性 | 类型 | 描述 |
| :-- | :-- | :-- |
| `message` | `Message` | 所有会话的消息，按会话类型和 ID 组织 |
| `currentCvsMsgs` | `(ChatSDK.MessageBody \| NoticeMessageBody)[]` | 当前会话的消息列表（computed） |
| `selectedMessage` | `SelectedMessage` | 选中的消息 |
| `repliedMessage` | `ChatSDK.MessageBody \| null` | 正在回复的消息 |
| `typing` | `Typing` | 正在输入状态 |
| `unreadMessageCount` | `number` | 未读消息数量（当前会话） |
| `holding` | `boolean` | 是否处于保持状态 |

### 对外方法

#### 消息发送与接收

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `sendMessage` | `(message: ChatSDK.MessageBody) => Promise<void>` | 发送消息（调用 SDK API） |
| `receiveMessage` | `(message: BaseMessageType) => void` | 接收消息（内部使用，通常由 SDK 事件触发） |
| `sendChannelAck` | `(cvs: CurrentConversation) => Promise<void>` | 发送频道确认消息，清除未读数（调用 SDK API） |
| `sendReadAck` | `(messageId: string, to: string) => void` | 发送已读回执（调用 SDK API） |

#### 消息操作

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `deleteMessage` | `(cvs: CurrentConversation, messageId: string \| string[]) => Promise<void>` | 删除消息（调用 SDK API） |
| `recallMessage` | `(cvs: CurrentConversation, messageId: string, isChatThread?: boolean, recallMySelfMsg?: boolean) => Promise<void>` | 撤回消息（调用 SDK API） |
| `modifyServerMessage` | `(messageId: string, msg: ChatSDK.ModifiedMsg) => Promise<void>` | 修改服务器端消息（调用 SDK API） |
| `modifyLocalMessage` | `(messageId: string, msg: ChatSDK.ModifiedEventMessage, isReceivedModify?: boolean) => void` | 修改本地消息（仅更新本地状态） |
| `modifyMessage` | `(id: string, message: ChatSDK.MessageBody \| NoticeMessageBody) => void` | 修改消息（仅更新本地状态） |
| `updateMessageStatus` | `(msgId: string, status: string) => void` | 更新消息状态（仅更新本地状态） |

#### 消息表情回复

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `addReaction` | `(cvs: CurrentConversation, messageId: string, emoji: string) => Promise<void>` | 添加消息表情回复（调用 SDK API） |
| `deleteReaction` | `(cvs: CurrentConversation, messageId: string, emoji: string) => Promise<void>` | 删除消息表情回复（调用 SDK API） |
| `updateReactions` | `(cvs: CurrentConversation, messageId: string, reactions: ReactionData[]) => void` | 更新消息表情回复列表（仅更新本地状态） |
| `getReactionUserList` | `(cvs: CurrentConversation, messageId: string, reaction: string) => Promise<void>` | 获取表情回复的用户列表（调用 SDK API） |

#### 消息翻译

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `translateMessage` | `(cvs: CurrentConversation, messageId: string, language: string) => Promise<boolean>` | 翻译消息（调用 SDK API） |

#### 其他操作

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `clearMessage` | `(cvs: CurrentConversation) => Promise<void>` | 清除会话消息（调用 SDK API） |
| `setRepliedMessage` | `(message: ChatSDK.MessageBody \| null) => void` | 设置正在回复的消息 |
| `setSelectedMessage` | `(cvs: CurrentConversation, selectedData: { selectable: boolean; selectedMessage: (ChatSDK.MessageBody \| NoticeMessageBody)[] }) => void` | 设置选中的消息 |
| `setTyping` | `(cvs: CurrentConversation, typing: boolean) => void` | 设置正在输入状态 |
| `sendTypingCmd` | `(cvs: CurrentConversation) => Promise<void>` | 发送正在输入命令（调用 SDK API） |
| `setHoldingStatus` | `(status: boolean) => void` | 设置保持状态 |
| `setUnreadMessageCount` | `(count: number) => void` | 设置未读消息数量 |
| `shiftBroadcastMessage` | `() => void` | 移除第一条广播消息 |

### 使用示例

```jsx
import { rootStore, chatSDK } from 'easemob-chat-uikit';

// 发送文本消息
const textMsg = chatSDK.message.create({
  type: 'txt',
  to: 'targetId',
  chatType: 'singleChat',
  msg: 'Hello',
});
rootStore.messageStore.sendMessage(textMsg);

// 撤回消息
rootStore.messageStore.recallMessage(
  {
    chatType: 'singleChat',
    conversationId: 'targetId',
  },
  'messageId',
);

// 添加表情回复
rootStore.messageStore.addReaction(
  {
    chatType: 'singleChat',
    conversationId: 'targetId',
  },
  'messageId',
  'emoji_1',
);

// 翻译消息
rootStore.messageStore.translateMessage(
  {
    chatType: 'singleChat',
    conversationId: 'targetId',
  },
  'messageId',
  'zh',
);
```

## addressStore

通讯录管理 Store，用于管理联系人、群组、聊天室等信息。

### 数据属性

| 属性 | 类型 | 描述 |
| :-- | :-- | :-- |
| `appUsersInfo` | `Record<string, AppUserInfo>` | 应用用户信息映射 |
| `contacts` | `{ userId: string; nickname: string; silent?: boolean; remark?: string }[]` | 联系人列表 |
| `groups` | `GroupItem[]` | 群组列表 |
| `chatroom` | `ChatroomInfo[]` | 聊天室列表 |
| `blockList` | `string[]` | 黑名单列表 |
| `hasGroupsNext` | `boolean` | 是否还有更多群组（分页） |

### 对外方法

#### 用户信息

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `setAppUserInfo` | `(appUsersInfo: Record<string, AppUserInfo>) => void` | 设置应用用户信息（仅更新本地状态） |
| `getUserInfo` | `(userId: string, withPresence?: boolean, force?: boolean) => Promise<AppUserInfo \| undefined>` | 获取用户信息（调用 SDK API） |
| `getUserInfoWithPresence` | `(userIdList: string[]) => Promise<void>` | 批量获取用户信息（含在线状态，调用 SDK API） |

#### 联系人管理

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `addContact` | `(userId: string) => Promise<void>` | 添加联系人（调用 SDK API） |
| `deleteContact` | `(userId: string) => Promise<void>` | 删除联系人（调用 SDK API） |
| `setContactRemark` | `(userId: string, remark: string) => Promise<void>` | 设置联系人备注（调用 SDK API） |
| `addContactToContactList` | `(userId: string, widthPresence?: boolean) => Promise<void>` | 添加联系人到列表（调用 SDK API 获取用户信息） |

#### 群组管理

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `setGroups` | `(groups: GroupItem[]) => void` | 设置群组列表（仅更新本地状态） |
| `getGroupInfo` | `(groupId: string) => Promise<void>` | 获取群组信息（调用 SDK API） |
| `createGroup` | `(members: string[]) => Promise<void>` | 创建群组（调用 SDK API） |
| `modifyGroup` | `(groupId: string, groupName: string, description: string) => Promise<void>` | 修改群组信息（调用 SDK API） |
| `destroyGroup` | `(groupId: string) => Promise<void>` | 解散群组（调用 SDK API） |
| `leaveGroup` | `(groupId: string) => Promise<void>` | 退出群组（调用 SDK API） |
| `inviteToGroup` | `(groupId: string, userIds: string[]) => Promise<void>` | 邀请用户加入群组（调用 SDK API） |
| `removeGroupMembers` | `(groupId: string, userIds: string[]) => Promise<void>` | 移除群组成员（调用 SDK API） |
| `setGroupMembers` | `(groupId: string, membersList: ChatSDK.GroupMember[]) => void` | 设置群组成员列表（仅更新本地状态） |
| `removeGroupMember` | `(groupId: string, userId: string) => void` | 移除群组成员（仅更新本地状态） |
| `setGroupMemberAttributes` | `(groupId: string, userId: string, attributes: ChatSDK.MemberAttributes) => void` | 设置群组成员属性（仅更新本地状态） |
| `setGroupAdmins` | `(groupId: string, admins: string[]) => void` | 设置群组管理员（仅更新本地状态） |
| `changeGroupOwner` | `(groupId: string, newOwner: string) => Promise<void>` | 转移群主（调用 SDK API） |
| `updateGroupName` | `(groupId: string, groupName: string) => void` | 更新群组名称（仅更新本地状态） |
| `updateGroupAvatar` | `(groupId: string, avatar: string) => void` | 更新群组头像（仅更新本地状态） |

#### 聊天室管理

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `setChatroom` | `(chatroom: ChatroomInfo[]) => void` | 设置聊天室列表（仅更新本地状态） |
| `updateChatroomMemberCount` | `(roomId: string, count: number) => void` | 更新聊天室成员数量（仅更新本地状态） |
| `setChatroomAdmins` | `(chatroomId: string, admins: string[]) => void` | 设置聊天室管理员（仅更新本地状态） |
| `muteChatRoomMember` | `(chatroomId: string, userId: string, muteDuration?: number) => Promise<void>` | 禁言聊天室成员（调用 SDK API） |
| `unmuteChatRoomMember` | `(chatroomId: string, userId: string) => Promise<void>` | 取消禁言聊天室成员（调用 SDK API） |
| `getChatroomMuteList` | `(chatroomId: string) => Promise<void>` | 获取聊天室禁言列表（调用 SDK API） |
| `removerChatroomMember` | `(chatroomId: string, userId: string) => Promise<void>` | 移除聊天室成员（调用 SDK API） |

#### 黑名单管理

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `getBlockList` | `() => Promise<void>` | 获取黑名单列表（调用 SDK API） |
| `addUsersToBlocklist` | `(userIdList: string[]) => Promise<void>` | 添加用户到黑名单（调用 SDK API） |
| `removeUserFromBlocklist` | `(userIdList: string[]) => Promise<void>` | 从黑名单移除用户（调用 SDK API） |

#### 在线状态

| 方法              | 类型                                     | 描述                         |
| :---------------- | :--------------------------------------- | :--------------------------- |
| `publishPresence` | `(description: string) => Promise<void>` | 发布在线状态（调用 SDK API） |

### 使用示例

```jsx
import { rootStore } from 'easemob-chat-uikit';

// 获取用户信息
rootStore.addressStore.getUserInfo('userId', true).then(userInfo => {
  console.log('用户信息:', userInfo);
});

// 创建群组
rootStore.addressStore.createGroup(['userId1', 'userId2']);

// 邀请用户加入群组
rootStore.addressStore.inviteToGroup('groupId', ['userId3', 'userId4']);

// 禁言聊天室成员
rootStore.addressStore.muteChatRoomMember('chatroomId', 'userId', 3600);

// 获取黑名单
rootStore.addressStore.getBlockList();
```

## pinnedMessagesStore

置顶消息管理 Store，用于管理置顶消息。

### 数据属性

| 属性       | 类型               | 描述                               |
| :--------- | :----------------- | :--------------------------------- |
| `messages` | `PinnedMessageMap` | 置顶消息映射，按会话类型和 ID 组织 |
| `visible`  | `boolean`          | 置顶消息面板是否可见               |

### 对外方法

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `unshiftPinnedMessage` | `(conversationType: ChatType, conversationId: string, message: PinnedMessage) => void` | 在列表开头添加置顶消息（仅更新本地状态） |
| `pushPinnedMessage` | `(conversationType: ChatType, conversationId: string, message: PinnedMessage) => void` | 在列表末尾添加置顶消息（仅更新本地状态） |
| `deletePinnedMessage` | `(conversationType: ChatType, conversationId: string, messageId: string) => void` | 删除置顶消息（仅更新本地状态） |
| `clearPinnedMessages` | `(conversationType: ChatType, conversationId: string) => void` | 清空置顶消息（仅更新本地状态） |
| `setPinnedMessageCursor` | `(conversationType: ChatType, conversationId: string, cursor: string \| null) => void` | 设置置顶消息分页游标（仅更新本地状态） |
| `updatePinnedMessage` | `(conversationType: ChatType, conversationId: string, messageId: string, pinnedTime: number, operatorId?: string) => void` | 更新置顶消息（仅更新本地状态） |
| `modifyPinnedMessage` | `(conversationType: ChatType, conversationId: string, message: ChatSDK.ModifiedEventMessage) => void` | 修改置顶消息（仅更新本地状态） |
| `changeVisible` | `(visible: boolean) => void` | 设置置顶消息面板可见性 |
| `pushPinNoticeMessage` | `(params: { conversationType: ChatType; conversationId: string; noticeType: 'pin' \| 'unpin'; operatorId: string; time: number }) => void` | 推送置顶/取消置顶通知消息（仅更新本地状态） |

### 使用示例

```jsx
import { rootStore } from 'easemob-chat-uikit';

// 添加置顶消息
rootStore.pinnedMessagesStore.unshiftPinnedMessage('singleChat', 'conversationId', {
  message: messageObj,
  operatorId: 'operatorId',
  pinTime: Date.now(),
});

// 删除置顶消息
rootStore.pinnedMessagesStore.deletePinnedMessage('singleChat', 'conversationId', 'messageId');

// 显示置顶消息面板
rootStore.pinnedMessagesStore.changeVisible(true);
```

## threadStore

话题管理 Store，用于管理话题（Thread）相关功能。

### 数据属性

| 属性 | 类型 | 描述 |
| :-- | :-- | :-- |
| `thread` | `ThreadData` | 话题数据映射 |
| `currentThread` | `CurrentThread` | 当前话题信息 |
| `showThreadPanel` | `boolean` | 话题面板是否显示 |
| `threadList` | `Record<string, (ChatSDK.ChatThreadDetail & { members?: string[] })[]>` | 话题列表 |

### 对外方法

| 方法 | 类型 | 描述 |
| :-- | :-- | :-- |
| `setThread` | `(thread: ThreadData) => void` | 设置话题数据（仅更新本地状态） |
| `setCurrentThread` | `(thread: CurrentThread) => void` | 设置当前话题（仅更新本地状态） |
| `setThreadVisible` | `(visible: boolean) => void` | 设置话题面板可见性 |
| `updateThreadInfo` | `(threadInfo: ChatSDK.ThreadChangeInfo) => void` | 更新话题信息（仅更新本地状态） |
| `getChatThreadDetail` | `(threadId: string) => Promise<void>` | 获取话题详情（调用 SDK API） |
| `getGroupChatThreads` | `(parentId: string) => Promise<void>` | 获取群组话题列表（调用 SDK API） |
| `getThreadMembers` | `(threadId: string) => Promise<void>` | 获取话题成员列表（调用 SDK API） |
| `removeChatThreadMember` | `(threadId: string, userId: string) => Promise<void>` | 移除话题成员（调用 SDK API） |

### 使用示例

```jsx
import { rootStore } from 'easemob-chat-uikit';

// 设置当前话题
rootStore.threadStore.setCurrentThread({
  visible: true,
  creating: false,
  info: threadInfo,
  originalMessage: message,
});

// 获取话题详情
rootStore.threadStore.getChatThreadDetail('threadId');

// 获取群组话题列表
rootStore.threadStore.getGroupChatThreads('parentId');
```

## 自定义 Hooks

### useChatContext

提供消息相关的数据和方法。

**返回值：**

```typescript
{
  messages: Message; // 所有消息
  repliedMessage: ChatSDK.MessageBody | null; // 正在回复的消息
  typing: Typing; // 正在输入状态
  sendMessage: (message: ChatSDK.MessageBody) => Promise<void>;
  deleteMessage: (cvs: CurrentConversation, messageId: string | string[]) => Promise<void>;
  recallMessage: (cvs: CurrentConversation, messageId: string, isChatThread?: boolean, recallMySelfMsg?: boolean) => Promise<void>;
  addReaction: (cvs: CurrentConversation, messageId: string, emoji: string) => Promise<void>;
  deleteReaction: (cvs: CurrentConversation, messageId: string, emoji: string) => Promise<void>;
  translateMessage: (cvs: CurrentConversation, messageId: string, language: string) => Promise<boolean>;
  modifyMessage: (messageId: string, msg: ChatSDK.ModifiedMsg) => Promise<void>;
  modifyLocalMessage: (messageId: string, msg: ChatSDK.ModifiedEventMessage, isReceivedModify?: boolean) => void;
  updateMessageStatus: (msgId: string, status: string) => void;
  sendTypingCommand: (cvs: CurrentConversation) => Promise<void>;
  setRepliedMessage: (message: ChatSDK.MessageBody | null) => void;
  clearMessages: (cvs: CurrentConversation) => Promise<void>;
}
```

### useConversationContext

提供会话相关的数据和方法。

**返回值：**

```typescript
{
  currentConversation: CurrentConversation; // 当前会话
  conversationList: Conversation[]; // 会话列表
  setCurrentConversation: (currentCvs: CurrentConversation) => void;
  deleteConversation: (conversation: CurrentConversation) => void;
  topConversation: (conversation: Conversation) => void;
  addConversation: (conversation: Conversation) => void;
  modifyConversation: (conversation: Conversation) => void;
}
```

### useAddressContext

提供通讯录相关的数据和方法。

**返回值：**

```typescript
{
  appUsersInfo: Record<string, AppUserInfo>; // 用户信息
  groups: GroupItem[]; // 群组列表
  setAppUserInfo: (appUsersInfo: Record<string, AppUserInfo>) => void;
  setGroups: (groups: GroupItem[]) => void;
  updateGroupName: (groupId: string, groupName: string) => void;
  setGroupMembers: (groupId: string, membersList: ChatSDK.GroupMember[]) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  setGroupMemberAttributes: (groupId: string, userId: string, attributes: ChatSDK.MemberAttributes) => void;
  setGroupAdmins: (groupId: string, admins: string[]) => void;
  getGroupMembers: (groupId: string, withUserInfo: boolean) => void;
}
```

### useChatroomContext

提供聊天室相关的数据和方法。

**返回值：**

```typescript
{
  chatroom: ChatroomInfo[]; // 聊天室列表
  muteChatRoomMember: (chatroomId: string, userId: string, muteDuration?: number) => Promise<void>;
  unmuteChatRoomMember: (chatroomId: string, userId: string) => Promise<void>;
  removerChatroomMember: (chatroomId: string, userId: string) => Promise<void>;
}
```

### useThreadContext

提供话题相关的数据和方法。

**返回值：**

```typescript
{
  currentThread: CurrentThread; // 当前话题
  threadList: Record<string, (ChatSDK.ChatThreadDetail & { members?: string[] })[]>; // 话题列表
  threadVisible: boolean; // 话题面板是否可见
  setCurrentThread: (thread: CurrentThread) => void;
  setThreadVisible: (visible: boolean) => void;
  getGroupChatThreads: (parentId: string) => Promise<void>;
  getThreadMembers: (threadId: string) => Promise<void>;
  removeChatThreadMember: (threadId: string, userId: string) => Promise<void>;
  getCurrentChatThreadDetail: (threadId: string) => Promise<void>;
}
```

## 注意事项

1. **方法分类**：

   - **调用 SDK API 的方法**：这些方法会先调用 SDK API，然后更新本地状态。通常用于需要同步到服务器的操作（如发送消息、创建群组等）。
   - **仅更新本地状态的方法**：这些方法只更新本地 MobX 状态，不会调用 SDK API。通常用于 UI 状态管理或本地数据同步。

2. **响应式更新**：

   - 直接使用 `rootStore` 时，需要在组件中使用 `observer` 包装组件才能响应 MobX 状态变化。
   - 使用自定义 Hooks 时，会自动处理响应式更新，组件会在数据变化时自动重新渲染。

3. **错误处理**：

   - 调用 SDK API 的方法会返回 Promise，可以通过 `.catch()` 处理错误。
   - UIKit 内部会通过 `eventHandler` 统一处理成功和错误事件。

4. **数据持久化**：

   - Store 中的数据是内存中的，页面刷新后会丢失。
   - 会话列表、消息等数据会通过 SDK 自动同步。

5. **最佳实践**：
   - 在 React 组件内，推荐使用自定义 Hooks。
   - 在组件外部或工具函数中，可以直接使用 `rootStore`。
   - 避免直接修改 Store 中的数据属性，应通过提供的方法来修改。
