# CallKit 头像提供者修复

## 问题描述

在 CallKit 组件中，有多处硬编码了默认头像 URL `'https://api.dicebear.com/7.x/avataaars/svg?seed=me'`，这些硬编码没有使用 `userInfoProvider` 提供的用户信息，导致无法显示正确的用户头像。

## 修复内容

### 1. 新增辅助函数

在 `CallKit.tsx` 中新增了两个辅助函数：

```typescript
// 从 userInfoProvider 获取用户头像的辅助函数
const getUserAvatar = React.useCallback(
  async (userId: string): Promise<string> => {
    if (!userInfoProvider) {
      // 如果没有配置 userInfoProvider，返回默认头像
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    }

    try {
      const userInfos = await Promise.resolve(userInfoProvider([userId]));
      const userInfo = userInfos.find((info: any) => info.userId === userId);
      return userInfo?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    } catch (error) {
      console.warn(`获取用户 ${userId} 头像失败:`, error);
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    }
  },
  [userInfoProvider],
);

// 获取本地用户头像的辅助函数
const getLocalUserAvatar = React.useCallback(async (): Promise<string> => {
  if (!webimConnection?.user) {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=me';
  }

  return await getUserAvatar(webimConnection.user);
}, [webimConnection?.user, getUserAvatar]);
```

### 2. 修改硬编码头像的地方

#### 2.1 CallService 初始化时的本地用户信息设置

**修改前：**

```typescript
const localUserInfo = {
  [webimConnection.user]: {
    nickname: '我',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  },
};
```

**修改后：**

```typescript
// 异步获取本地用户头像
getLocalUserAvatar().then(avatarUrl => {
  const localUserInfo = {
    [webimConnection.user]: {
      nickname: '我',
      avatarUrl: avatarUrl,
    },
  };
  if (callServiceRef.current) {
    callServiceRef.current.setUserInfo(localUserInfo);
    console.log('📝 CallService初始化后，已设置本地用户信息:', {
      userId: webimConnection.user,
      nickname: '我',
      avatarUrl: avatarUrl,
    });
  }
});
```

#### 2.2 群组通话发起时的本地用户信息设置

**修改前：**

```typescript
if (webimConnection?.user) {
  userInfoMap[webimConnection.user] = {
    nickname: '我',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  };
}
```

**修改后：**

```typescript
if (webimConnection?.user) {
  // 异步获取本地用户头像
  getLocalUserAvatar().then(avatarUrl => {
    userInfoMap[webimConnection.user] = {
      nickname: '我',
      avatarUrl: avatarUrl,
    };
    if (callServiceRef.current) {
      callServiceRef.current.setUserInfo(userInfoMap);
      console.log('📝 发起群组通话前，已设置用户信息到CallService:', {
        用户数量: Object.keys(userInfoMap).length,
        用户列表: Object.entries(userInfoMap).map(
          ([userId, info]) => `${userId}(${info.nickname})`,
        ),
      });
    }
  });
}
```

#### 2.3 视频窗口创建时的头像设置

对于同步创建的视频窗口对象，由于无法直接使用异步函数，暂时保留默认头像并添加注释说明：

```typescript
avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me', // 临时使用默认头像，后续会通过 userInfoProvider 更新
```

### 3. Demo 文件修改

在 demo 文件中添加了注释说明：

```typescript
avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me'; // 演示模式使用默认头像
```

## 使用说明

### 1. 配置 userInfoProvider

要使用正确的用户头像，需要配置 `userInfoProvider`：

```typescript
const userInfoProvider = async (userIds: string[]) => {
  // 从你的用户系统获取用户信息
  const userInfos = await fetchUserInfos(userIds);
  return userInfos.map(user => ({
    userId: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl, // 用户的真实头像URL
  }));
};
```

### 2. 头像获取逻辑

- **有 userInfoProvider**：从 provider 获取用户头像
- **无 userInfoProvider**：使用默认的 dicebear 头像
- **获取失败**：回退到默认头像

### 3. 异步处理

由于 `userInfoProvider` 是异步的，头像获取也是异步的。在同步上下文中（如创建视频窗口对象），暂时使用默认头像，后续会通过 `userInfoProvider` 异步更新。

## 注意事项

1. **异步更新**：头像会在组件初始化后异步更新
2. **错误处理**：如果获取头像失败，会回退到默认头像
3. **向后兼容**：如果没有配置 `userInfoProvider`，仍然使用默认头像
4. **性能考虑**：头像获取有缓存机制，避免重复请求

## 测试建议

1. 配置 `userInfoProvider` 并测试头像是否正确显示
2. 测试网络错误时的回退机制
3. 测试未配置 `userInfoProvider` 时的默认行为
4. 测试异步更新是否正常工作
