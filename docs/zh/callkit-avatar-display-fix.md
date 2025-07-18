# CallKit 1v1 视频通话头像显示修复

## 问题描述

在 1v1 视频通话中，当一方关闭摄像头时，对方显示的是默认头像`PERSON_SINGLE_FILL`，而不是对方的真实头像。Header 中能正确显示对方的真实头像，但视频窗口中显示的是默认头像。

### 问题现象

- 1v1 视频通话正常进行
- 一方关闭摄像头
- 对方视频窗口显示默认头像，而不是真实头像
- Header 中显示正确的真实头像

### 根本原因

问题在于`CallService`中的`userInfos`缓存机制：

1. **主叫方发起通话时**：只设置了本地用户信息，没有设置被叫方用户信息
2. **被叫方收到邀请时**：设置了主叫方用户信息，但没有设置自己的用户信息
3. **摄像头关闭时**：`user-unpublished`事件中尝试从`userInfos`获取用户信息，但主叫方的`userInfos`中没有被叫方信息，被叫方的`userInfos`中没有主叫方信息

## 解决方案

### 1. 修复主叫方发起 1v1 通话时的用户信息设置

**修改文件：** `module/callkit/CallKit.tsx`

**修改位置：** `startRealCall`方法中的 1v1 通话处理逻辑

```typescript
// 🔧 修复：主叫方发起1v1通话时，设置被叫方用户信息到CallService
if (callServiceRef.current) {
  const targetUserInfo = {
    [options.to]: {
      nickname: targetUserNickname,
      avatarUrl: targetUserAvatar,
    },
  };
  callServiceRef.current.setUserInfo(targetUserInfo);
  console.log('📝 主叫方发起1v1通话时，已设置被叫方用户信息到CallService:', {
    userId: options.to,
    nickname: targetUserNickname,
    avatar: targetUserAvatar,
  });
}
```

### 2. 修复被叫方收到邀请时的用户信息设置

**修改文件：** `module/callkit/services/CallService.ts`

**修改位置：** `handleInvitationMessage`方法

```typescript
// 🔧 修复：将被叫方收到邀请时，设置主叫方用户信息到CallService
if (callerName || callerAvatar) {
  const callerUserInfoMap = {
    [message.from]: {
      nickname: callerName,
      avatarUrl: callerAvatar,
    },
  };
  this.setUserInfo(callerUserInfoMap);
  console.log('📝 被叫方收到邀请时，已设置主叫方用户信息到CallService:', {
    userId: message.from,
    nickname: callerName,
    avatar: callerAvatar,
  });
}
```

### 3. 确保用户信息在事件处理中正确使用

**修改文件：** `module/callkit/services/CallService.ts`

**修改位置：** `user-unpublished`事件处理

```typescript
// 创建更新后的视频信息（关闭摄像头，显示头像）
const updatedVideoInfo: VideoWindowProps = {
  id: `remote-${user.uid}`,
  isLocalVideo: false,
  muted: this.getRemoteUserMutedStatus(user.uid),
  cameraEnabled: false, // 摄像头关闭
  nickname: this.userInfos[userId]?.nickname || userId,
  avatar: this.userInfos[userId]?.avatarUrl, // 使用缓存的头像
  stream: undefined,
  isWaiting: false,
};
```

## 修复效果

### 修复前

- 主叫方关闭摄像头：被叫方显示默认头像
- 被叫方关闭摄像头：主叫方显示默认头像
- Header 中显示正确头像

### 修复后

- 主叫方关闭摄像头：被叫方显示主叫方真实头像 ✅
- 被叫方关闭摄像头：主叫方显示被叫方真实头像 ✅
- Header 中显示正确头像 ✅

## 测试验证

### 测试场景

1. **主叫方发起 1v1 视频通话**

   - 验证被叫方用户信息是否正确设置到`CallService`

2. **被叫方收到邀请**

   - 验证主叫方用户信息是否正确设置到`CallService`

3. **一方关闭摄像头**
   - 验证对方是否显示真实头像而不是默认头像

### 测试页面

创建了测试页面 `demo/callkit/avatar-display-test.html` 用于验证修复效果。

## 调试信息

修复后添加了详细的调试日志：

```typescript
console.log('📝 主叫方发起1v1通话时，已设置被叫方用户信息到CallService:', {
  userId: options.to,
  nickname: targetUserNickname,
  avatar: targetUserAvatar,
});

console.log('📝 被叫方收到邀请时，已设置主叫方用户信息到CallService:', {
  userId: message.from,
  nickname: callerName,
  avatar: callerAvatar,
});

console.log('远程用户关闭了摄像头，切换到头像显示:', {
  userId,
  nickname: this.userInfos[userId]?.nickname,
  hasAvatar: !!this.userInfos[userId]?.avatarUrl,
});
```

## 技术细节

### 用户信息缓存机制

`CallService`使用`userInfos`对象缓存用户信息：

```typescript
private userInfos: { [key: string]: any } = {};
```

### 用户信息设置方法

```typescript
setUserInfo(userInfo: { [key: string]: any }) {
  this.userInfos = { ...this.userInfos, ...userInfo };
  // ... 其他逻辑
}
```

### 头像显示逻辑

在`user-unpublished`事件中，当摄像头关闭时：

```typescript
avatar: this.userInfos[userId]?.avatarUrl,
```

如果`userInfos[userId]`为空，则显示默认头像。

## 相关文件

- `module/callkit/CallKit.tsx` - 主叫方用户信息设置
- `module/callkit/services/CallService.ts` - 被叫方用户信息设置和事件处理
- `demo/callkit/avatar-display-test.html` - 测试页面

## 注意事项

1. **用户信息提供器**：确保配置了正确的`userInfoProvider`来获取用户头像
2. **异步处理**：用户信息获取是异步的，需要等待完成后再设置
3. **错误处理**：如果获取用户信息失败，会使用默认头像作为 fallback

## 版本历史

- **v1.0.0** - 初始版本，存在头像显示问题
- **v1.1.0** - 修复 1v1 视频通话头像显示问题
  - 主叫方发起通话时设置被叫方用户信息
  - 被叫方收到邀请时设置主叫方用户信息
  - 确保摄像头关闭时显示真实头像
