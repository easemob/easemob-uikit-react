# CallKit 群成员自动获取功能文档

## 概述

CallKit 新增了基于群组 ID 自动获取群成员的功能，支持在多人通话中自动拉取群成员列表，无需手动配置成员信息。

## 主要功能

### 1. 自动获取群成员

- 调用 `startGroupCall(groupId)` 方法时自动获取群成员
- 使用环信 IM SDK 的 `listGroupMembers` 方法
- 支持批量获取用户详细信息（昵称、头像等）

### 2. 批量用户信息处理

- `groupMemberProvider` 函数现在接受 `userIds: string[]` 参数
- 返回 `UserInfo[]` 数组，支持批量处理，提高性能
- 自动生成默认头像（基于用户 ID 的唯一头像）

### 3. 动态群成员获取

- 被邀请方在添加参与者时自动获取群成员列表
- 智能数据合并：IM SDK 数据优先级高于传统 props
- 支持加载状态和错误处理

### 4. 分页获取所有群成员

- 自动循环分页获取所有群成员，不限于 50 个
- 支持通过 `isLast` 字段或返回数据量判断是否获取完成
- 确保大型群组的所有成员都能被正确获取和显示

### 5. 代码封装优化

- 创建了 `fetchGroupMembers` 方法统一处理群成员获取逻辑
- 消除了约 120 行重复代码，提高代码质量
- 统一的错误处理和日志记录

## 新增 API

### startGroupCall 方法（已优化）

```typescript
// 现在支持异步操作和自动获取群成员
await callKitRef.current.startGroupCall(groupId, 'video');
```

### groupMemberProvider（已优化）

```typescript
// 批量处理方式
groupMemberProvider: async (userIds: string[]) => {
  // 批量获取用户信息，减少 API 调用
  const users = await batchGetUserInfo(userIds);
  return users.map(user => ({
    userId: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatar,
  }));
};
```

## 使用示例

### 基本用法

```typescript
import { CallKit } from 'easemob-uikit-react';

const App = () => {
  const callKitRef = useRef<CallKitRef>(null);

  // 批量获取用户信息的函数
  const handleGroupMemberProvider = async (userIds: string[]) => {
    try {
      const users = await batchGetUserInfo(userIds);
      return users.map(user => ({
        userId: user.id,
        nickname: user.nickname || user.id,
        avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      }));
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return userIds.map(userId => ({
        userId,
        nickname: userId,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      }));
    }
  };

  const startCall = async () => {
    await callKitRef.current?.startGroupCall('group123', 'video');
  };

  return (
    <CallKit
      ref={callKitRef}
      enableRealCall={true}
      webimConnection={connection}
      groupMemberProvider={handleGroupMemberProvider}
    />
  );
};
```

### 高级用法：自定义用户信息

```typescript
const handleGroupMemberProvider = async (userIds: string[]) => {
  // 从多个数据源获取用户信息
  const [dbUsers, imUsers] = await Promise.all([
    getUsersFromDatabase(userIds),
    getUsersFromIM(userIds),
  ]);

  return userIds.map(userId => {
    const dbUser = dbUsers.find(u => u.id === userId);
    const imUser = imUsers.find(u => u.id === userId);

    return {
      userId,
      nickname: dbUser?.nickname || imUser?.nickname || userId,
      avatarUrl: dbUser?.avatar || imUser?.avatar || generateAvatar(userId),
    };
  });
};
```

## 主要优化

### 1. 性能优化

- **分页获取**：自动循环获取所有群成员，支持大型群组
- **批量处理**：一次 API 调用获取所有用户信息
- **智能缓存**：避免重复获取相同用户信息
- **异步处理**：不阻塞 UI 渲染

### 2. 错误处理增强

```typescript
// 详细的错误日志和降级处理
try {
  const members = await fetchGroupMembers(groupId, 'context');
  console.log('获取成功:', members);
} catch (error) {
  console.error('获取失败，使用默认数据:', error);
  // 自动降级到基础数据
}
```

### 3. 调试友好

- 添加了详细的 context 标识
- 每个操作都有对应的日志输出
- 清晰的错误信息和建议

## 兼容性说明

### 向后兼容

- 原有的 `groupMembers` props 仍然支持
- 数据合并策略：IM SDK 数据优先级更高
- 旧版本的使用方式完全兼容

### 废弃的 API

- `webimGroupId` props 已标记为废弃
- 建议直接使用 `startGroupCall(groupId)` 方法

## 注意事项

### 1. 网络要求

- 需要确保 IM SDK 连接正常
- `groupMemberProvider` 函数需要处理网络异常

### 2. 权限要求

- 需要群组成员查询权限
- 确保有获取用户信息的相关权限

### 3. 性能考虑

- 系统已自动实现分页处理，支持任意大小的群组
- 大群组获取时会显示详细的分页日志，便于监控进度
- 考虑实现本地缓存减少网络请求

## 问题解决

### 常见问题

1. **获取群成员失败**

   - 检查 IM SDK 连接状态
   - 验证群组 ID 是否正确
   - 确认用户是否有群组访问权限

2. **用户信息显示不完整**

   - 检查 `groupMemberProvider` 返回的数据格式
   - 确保所有必要字段都有默认值

3. **性能问题**
   - 使用批量 API 而不是逐个请求
   - 实现合理的缓存策略

### 调试技巧

```typescript
// 开启详细日志
console.log('群成员获取调试信息:', {
  groupId,
  hasConnection: !!webimConnection,
  hasProvider: !!groupMemberProvider,
  memberCount: members.length,
});
```

## 更新日志

### v1.1.0 - 批量处理优化

- 优化 `groupMemberProvider` 为批量处理模式
- 移除 `webimGroupId` 依赖，简化 API
- 添加动态群成员获取功能

### v1.0.0 - 基础功能

- 实现基于群组 ID 的自动成员获取
- 支持自定义用户信息提供者
- 完善错误处理和日志记录

## 用户信息一致性修复

### 问题描述

在之前的版本中，存在一个显示不一致的问题：

- **接通前**：显示头像时正确显示用户的 nickname
- **接通后**：显示视频流时显示的是 userId 而不是 nickname

### 根本原因

CallService 在处理远程用户发布视频流时，如果 `userInfos` 中没有对应的用户信息，就会使用 `userId` 作为 fallback：

```typescript
// 问题代码
nickname: this.userInfos[userId]?.nickname || userId; // fallback 到 userId
```

### 修复方案

通过在多个关键节点设置用户信息到 CallService，确保所有场景下都能正确显示 nickname：

#### 1. fetchGroupMembers 方法优化

```typescript
// 获取群成员后立即设置到 CallService
if (callServiceRef.current && formattedMembers.length > 0) {
  const userInfoMap: { [key: string]: any } = {};
  formattedMembers.forEach(member => {
    userInfoMap[member.userId] = {
      nickname: member.nickname,
      avatarUrl: member.avatarUrl,
    };
  });
  callServiceRef.current.setUserInfo(userInfoMap);
}
```

#### 2. 发起群组通话时设置用户信息

```typescript
// 在 handleUserSelectConfirm 中发起通话前设置
const userInfoMap: { [key: string]: any } = {};
selectedUsers.forEach(user => {
  userInfoMap[user.userId] = {
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
  };
});
// 添加本地用户信息
if (webimConnection?.user) {
  userInfoMap[webimConnection.user] = {
    nickname: '我',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  };
}
callServiceRef.current.setUserInfo(userInfoMap);
```

#### 3. 添加参与者时设置用户信息

```typescript
// 在添加新参与者前设置用户信息
const newUserInfoMap: { [key: string]: any } = {};
newMembers.forEach(user => {
  newUserInfoMap[user.userId] = {
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
  };
});
callServiceRef.current.setUserInfo(newUserInfoMap);
```

#### 4. CallService 初始化时设置本地用户信息

```typescript
// 在 CallService 初始化后立即设置本地用户信息
if (webimConnection?.user) {
  const localUserInfo = {
    [webimConnection.user]: {
      nickname: '我',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
    },
  };
  callServiceRef.current.setUserInfo(localUserInfo);
}
```

### 修复效果

- ✅ 所有场景下都正确显示用户的 nickname
- ✅ 接通前后显示一致性
- ✅ 本地用户和远程用户都正确显示
- ✅ 动态添加的参与者也正确显示

### 调试信息

修复后添加了详细的调试日志，方便问题排查：

```typescript
console.log('📝 已将用户信息设置到CallService:', {
  用户数量: formattedMembers.length,
  用户列表: formattedMembers.map(m => `${m.userId}(${m.nickname})`),
});
```

### 被邀请方用户信息获取优化

为了确保被邀请方也能正确显示用户的 nickname，我们在被邀请方的所有入口都添加了获取群成员信息的逻辑：

#### 1. answerRealCall 方法（接受邀请时）

```typescript
// 被邀请方接受群组通话邀请时，获取群成员信息
if (result && invitation?.type === 'group' && invitation.groupId) {
  const formattedMembers = await fetchGroupMembers(invitation.groupId, '被邀请方接受邀请');
  // 自动设置用户信息到 CallService
}
```

#### 2. handleNotificationClick 方法（点击通知进入预览时）

```typescript
// 被邀请方点击通知进入预览时，获取群成员信息
if (currentCallMode === 'group' && invitation.groupId) {
  const formattedMembers = await fetchGroupMembers(invitation.groupId, '被邀请方预览界面');
}
```

#### 3. handleAccept 方法（直接点击接听按钮时）

```typescript
// 被邀请方直接接听群组通话时，获取群成员信息
if (currentCallMode === 'group' && invitationData.groupId) {
  const formattedMembers = await fetchGroupMembers(invitationData.groupId, '被邀请方直接接听');
}
```

#### 4. InvitationInfo 接口优化

```typescript
export interface InvitationInfo {
  // ...
  groupId?: string; // 新增：群组ID字段
  // ...
}
```

这样确保了**无论被邀请方通过哪种方式进入群组通话**，都能获取到群成员信息，从而显示正确的 nickname 而不是 userId。

### 修复效果总结

- ✅ **发起方和被邀请方**都正确显示用户的 nickname
- ✅ **所有场景下都一致**：接通前后显示一致性
- ✅ **本地用户和远程用户**都正确显示
- ✅ **动态添加的参与者**也正确显示
- ✅ **被邀请方的所有入口**都能正确获取用户信息

这样确保了在整个通话流程中，用户信息的显示始终保持一致和正确。

## 分页获取群成员详细说明

### 技术实现

系统现在支持自动分页获取所有群成员，无论群组大小如何：

```typescript
// 分页获取逻辑
const allMemberUserIds: string[] = [];
let pageNum = 1;
const pageSize = 50;
let hasMoreData = true;

while (hasMoreData) {
  const response = await webimConnection.listGroupMembers({
    groupId: groupId,
    pageNum: pageNum,
    pageSize: pageSize,
  });

  if (response?.data && Array.isArray(response.data)) {
    const pageUserIds = response.data.map((item: any) => item.owner || item.member).filter(Boolean);

    allMemberUserIds.push(...pageUserIds);

    // 判断是否还有下一页数据
    if (response.isLast === true) {
      // 方法1：通过 isLast 字段判断
      hasMoreData = false;
    } else if (pageUserIds.length < pageSize) {
      // 方法2：返回数据量小于 pageSize 说明已获取完
      hasMoreData = false;
    } else {
      pageNum++;
    }
  } else {
    hasMoreData = false;
  }
}
```

### 终止条件

系统支持两种方式判断是否获取完所有成员：

1. **isLast 字段**：API 返回的 `response.isLast === true` 表示已是最后一页
2. **数据量判断**：如果返回的成员数量小于 `pageSize`，说明已获取完所有数据

### 调试日志

分页获取过程中会输出详细的日志，便于监控和调试：

```
🔄 startGroupCall：开始获取群成员，群组ID: group-123
📄 startGroupCall：获取第 1 页，每页 50 个成员
📋 startGroupCall：第 1 页获取到 50 个成员
📄 startGroupCall：获取第 2 页，每页 50 个成员
📋 startGroupCall：第 2 页获取到 35 个成员
✅ startGroupCall：返回数据量 35 < 50，已获取完所有成员
📊 startGroupCall：分页获取完成，总共获取到 85 个群成员
```

### 性能优化

- **自动分页**：无需手动处理分页逻辑，系统自动循环获取
- **批量处理**：获取到所有成员 ID 后，一次性调用 `groupMemberProvider` 获取用户详情
- **错误处理**：任何一页获取失败都会停止循环，避免无限重试
- **内存优化**：使用数组追加而不是重复创建新数组

这样确保了即使是几百人的大群组，也能完整获取所有成员的信息并正确显示昵称。
