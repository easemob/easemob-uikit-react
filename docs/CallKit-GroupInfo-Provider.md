# CallKit GroupInfoProvider 功能说明

## 概述

`groupInfoProvider` 是 CallKit 的新功能，用于在群组通话邀请中提供群组名称和头像信息。这样被邀请人可以在接收邀请时看到群组的详细信息，提升用户体验。

## 功能特性

### 1. 群组信息显示

- 在群组通话邀请中显示群组名称和头像
- 自动缓存群组信息，避免重复请求
- 被邀请方也可以复用缓存的群组信息

### 2. 缓存机制

- 发起方获取的群组信息会通过邀请消息传递给被邀请方
- 被邀请方收到邀请后自动缓存群组信息
- 当被邀请方后续邀请其他人时，直接使用缓存的群组信息

## 使用方法

### 1. 配置 groupInfoProvider

```tsx
import { CallKit } from 'easemob-uikit-react';

const App = () => {
  // 群组信息提供器
  const groupInfoProvider = async (groupIds: string[]) => {
    // 调用您的群组信息获取接口
    const groupInfos = await getGroupInfosFromServer(groupIds);

    return groupInfos.map(group => ({
      groupId: group.id,
      groupName: group.name,
      groupAvatar: group.avatar,
    }));
  };

  return (
    <CallKit
      ref={callKitRef}
      enableRealCall={true}
      webimConnection={connection}
      userInfoProvider={userInfoProvider}
      groupInfoProvider={groupInfoProvider} // 添加群组信息提供器
    />
  );
};
```

### 2. 接口定义

```typescript
// 群组信息提供器函数签名
type GroupInfoProvider = (groupIds: string[]) => Promise<GroupInfo[]> | GroupInfo[];

// 群组信息接口
interface GroupInfo {
  groupId: string; // 群组ID
  groupName?: string; // 群组名称
  groupAvatar?: string; // 群组头像URL
}
```

### 3. 发起群组通话

```typescript
// 发起群组通话（会自动获取群组信息）
await callKitRef.current?.startGroupCall('group_123', 'video');

// 或者直接发起真实通话
callKitRef.current?.startRealCall({
  to: 'user1',
  callType: 'video',
  groupId: 'group_123',
  groupName: '工作群', // 可选，如果有 groupInfoProvider 会自动获取
  members: ['user1', 'user2', 'user3'],
});
```

## 工作流程

### 发起方流程

1. 调用 `startGroupCall` 或 `startRealCall` 发起群组通话
2. CallService 检查群组信息缓存
3. 如果缓存中没有，调用 `groupInfoProvider` 获取群组信息
4. 将群组信息缓存到本地
5. 发送邀请消息时包含群组名称和头像

### 被邀请方流程

1. 接收到群组通话邀请消息
2. 从消息中提取群组名称和头像信息
3. 自动缓存群组信息到本地
4. 在邀请界面显示群组名称和头像
5. 后续邀请其他人时复用缓存的群组信息

## 消息格式

### 邀请消息结构

```json
{
  "ext": {
    "action": "invite",
    "channelName": "channel_name",
    "type": 2,
    "callId": "call_123",
    "ext": {
      "groupId": "group_123",
      "groupName": "工作群",
      "groupAvatar": "https://example.com/group_avatar.png"
    },
    "ease_chat_uikit_user_info": {
      "nickname": "张三",
      "avatarURL": "https://example.com/avatar.png"
    }
  }
}
```

## 缓存机制

### 缓存存储

```typescript
// CallService 内部缓存结构
private cachedGroupInfos: {
  [groupId: string]: {
    groupName?: string;
    groupAvatar?: string
  }
} = {};
```

### 缓存策略

1. **优先使用缓存**：发送邀请前先检查缓存
2. **自动缓存**：获取到群组信息后自动缓存
3. **跨用户共享**：被邀请方接收到的群组信息也会被缓存
4. **生命周期管理**：CallService 销毁时清理缓存

## API 参考

### CallKit Props

```typescript
interface CallKitProps {
  // 其他属性...
  groupInfoProvider?: (groupIds: string[]) => Promise<GroupInfo[]> | GroupInfo[];
}
```

### InvitationInfo 扩展

```typescript
interface InvitationInfo {
  // 其他属性...
  groupAvatar?: string; // 群组头像URL
}
```

### CallService 方法

```typescript
// 获取缓存的群组信息
getCachedGroupInfo(groupId: string): { groupName?: string; groupAvatar?: string } | null;

// 设置群组信息缓存
setCachedGroupInfo(groupId: string, groupInfo: { groupName?: string; groupAvatar?: string }): void;
```

## 注意事项

1. **可选配置**：`groupInfoProvider` 是可选的，如果不提供则只显示群组 ID
2. **异步支持**：支持同步和异步的群组信息提供器
3. **错误处理**：如果获取群组信息失败，会优雅降级显示默认信息
4. **性能优化**：使用缓存避免重复请求相同群组的信息
5. **兼容性**：与现有的用户信息提供器功能完全兼容

## 示例实现

```typescript
const groupInfoProvider = async (groupIds: string[]) => {
  try {
    // 批量获取群组信息
    const response = await fetch('/api/groups/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupIds }),
    });

    const groups = await response.json();

    return groups.map(group => ({
      groupId: group.id,
      groupName: group.name,
      groupAvatar: group.avatar_url,
    }));
  } catch (error) {
    console.error('获取群组信息失败:', error);
    // 返回基本信息
    return groupIds.map(id => ({ groupId: id }));
  }
};
```

通过以上配置，您的 CallKit 将支持完整的群组信息显示功能，为用户提供更好的群组通话体验！
