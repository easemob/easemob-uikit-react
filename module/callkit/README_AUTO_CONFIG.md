# CallKit 自动配置重构

## 概述

为了简化 CallKit 的使用，我们重构了配置系统，使其能够自动从环信 WebIM 连接中获取必要的配置信息，并自动生成通话 ID 和频道名称，用户无需手动提供这些参数。

## 重构内容

### 移除的配置参数

以下配置参数已被移除，因为它们现在会自动处理：

- `agoraAppId` - 现在从 `webimConnection.appKey` 自动获取
- `agoraUid` - 现在从 `webimConnection.userId` 自动获取
- `accessToken` - 现在从 `webimConnection.getRTCToken()` 自动获取
- `callId` - 现在使用 `webimConnection.userId` 作为通话 ID
- `channel` - 现在使用 8 位随机字符串自动生成

### 移除的方法

以下方法已从`CallKitRef`接口中移除：

- `setAccessToken(token: string)` - 不再需要手动设置 token
- `setUserIdMap(idMap: { [key: string]: string })` - 不再需要用户 ID 映射

### 类型变更

- `agoraUid` 现在使用 `string` 类型而不是 `number` 类型
- `startRealCall` 方法的 `options` 参数中移除了 `callId`、`channel` 和 `accessToken` 字段

## 使用示例

### 旧版本使用方式

```tsx
// 旧版本 - 需要手动配置
<CallKit
  ref={callKitRef}
  enableRealCall={true}
  agoraAppId="your_app_id"
  agoraUid="your_uid"
  webimConnection={connection}
/>;

// 需要手动设置token
callKitRef.current?.setAccessToken('your_token');
callKitRef.current?.setUserIdMap({ uid: 'username' });

// 发起通话时需要提供多个参数
callKitRef.current?.startRealCall({
  callId: 'call_123',
  channel: 'channel_name',
  to: 'target_user',
  callType: 'video',
  accessToken: 'your_token',
});
```

### 新版本使用方式

```tsx
// 新版本 - 自动配置
<CallKit ref={callKitRef} enableRealCall={true} webimConnection={connection} />;

// 不需要手动设置任何配置

// 发起通话时只需要基本参数
callKitRef.current?.startRealCall({
  to: 'target_user',
  callType: 'video',
});
```

## 自动生成规则

### 通话 ID (callId)

- 使用 `webimConnection.getUniqueId().toString()` 生成唯一 ID
- 每次通话都会生成新的唯一标识符
- 确保不同通话之间的 ID 不会冲突

### 频道名称 (channel)

- 使用 8 位随机字符串
- 字符集：`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`
- 示例：`a1B2c3D4`

### 访问令牌 (accessToken)

- 通过 `webimConnection.getRTCToken()` 方法异步获取
- 在需要时自动调用，无需手动管理

## WebIM 连接要求

为了支持自动配置，WebIM 连接对象必须提供以下属性和方法：

```typescript
interface WebIMConnection {
  userId: string; // 用户ID，用作agoraUid
  appKey: string; // 应用Key，用作agoraAppId
  clientResource?: string; // 客户端资源标识

  // 生成唯一ID的方法
  getUniqueId(): string;

  // 异步获取RTC Token的方法
  getRTCToken(): Promise<string>;

  // 其他必要的方法
  addEventHandler(name: string, handler: any): void;
  removeEventHandler(name: string): void;
  send(message: any): Promise<void>;
}
```

## 迁移指南

### 1. 更新 CallKit props

移除这些 props：

- `agoraAppId`
- `agoraUid`

### 2. 移除手动配置代码

删除以下代码：

```tsx
// 删除这些调用
callKitRef.current?.setAccessToken('token');
callKitRef.current?.setUserIdMap({ uid: 'username' });
```

### 3. 更新 startRealCall 调用

移除多个参数：

```tsx
// 旧版本
callKitRef.current?.startRealCall({
  callId: 'call_123', // 删除这行
  channel: 'channel_name', // 删除这行
  to: 'target_user',
  callType: 'video',
  accessToken: 'token', // 删除这行
});

// 新版本
callKitRef.current?.startRealCall({
  to: 'target_user',
  callType: 'video',
});
```

### 4. 简化 UI 配置

如果您的应用有配置界面，可以移除以下配置项：

- 声网 App ID 输入框
- 声网 UID 输入框
- 访问令牌输入框
- 频道名称输入框

### 5. 确保 WebIM 连接正确

确保你的 WebIM 连接对象实现了必要的方法，特别是 `getUniqueId()` 和 `getRTCToken()` 方法。

## 优势

1. **极简配置**：用户只需要提供目标用户即可开始通话
2. **自动管理**：所有技术细节都由 CallKit 内部处理
3. **错误减少**：减少了手动配置错误的可能性
4. **开发效率**：大幅减少集成所需的代码量
5. **用户体验**：使用更加直观和简单

## 注意事项

1. 确保 WebIM 连接在 CallKit 初始化之前已经建立
2. `getUniqueId()` 和 `getRTCToken()` 方法应该正确实现
3. 如果 WebIM 连接断开，CallKit 的通话功能可能会受到影响
4. 频道名称是随机生成的，如果需要特定的频道名称，请联系开发团队
5. 通话 ID 每次都会生成新的唯一标识符，确保不同通话之间不会冲突

## URL 参数登录功能

### 概述

为了进一步简化开发和测试流程，demo 还支持通过 URL 参数进行自动登录，无需在界面上手动输入登录信息。

### 支持的 URL 参数

- `userId` - 用户 ID
- `password` - 用户密码
- `appKey` - 应用的 AppKey（可选，默认为 `easemob-demo#agora-rtc`）

### 使用示例

#### 完整 URL 示例

```
https://your-domain.com/demo/callkit/real-call-demo.html?userId=user123&password=123456&appKey=your-app-key
```

#### 基本使用（使用默认 AppKey）

```
https://your-domain.com/demo/callkit/real-call-demo.html?userId=user123&password=123456
```

### 安全注意事项

⚠️ **重要提醒**：URL 参数登录主要用于开发和测试环境，不建议在生产环境中使用，因为：

1. URL 参数可能会被浏览器历史记录保存
2. URL 可能会被服务器日志记录
3. URL 可能会被分享时意外泄露

在生产环境中，建议使用更安全的认证方式。
