# CallKit 1v1 视频流播放问题修复

## 问题描述

在 1v1 视频通话中，有时会出现看不到对方视频流的问题。根据控制台日志分析，主要原因是：

```
🎮 播放远程视频轨道 (尝试 4/5): {用户ID: 'lxm', 轨道ID: 'track-video-lxm-client-47d78_5ad73', 找到目标元素: false, 目标选择器: '[data-video-id="remote-lxm"] video, [data-video-id="remote-lxm"].cui-callkit-video', 当前页面所有video元素: 1, …}
❌ 第 4 次未找到用户 lxm 对应的video元素，4000ms后重试...
❌ 重试 5 次后仍未找到用户 lxm 对应的video元素
```

### 根本原因

1. **时序问题**：UI 渲染是异步的，但 CallService 在固定延迟后就开始查找 video 元素
2. **重试机制不够智能**：只是简单的延迟重试，没有基于事件驱动
3. **DOM 元素未及时创建**：远程视频的 DOM 元素还没有被创建或渲染完成

## 解决方案

### 方案 1：事件驱动 + 智能重试（推荐）

#### 1. 新增事件驱动机制

在 `CallService` 中添加了事件驱动的视频播放机制：

```typescript
// 🔧 新增：存储等待播放的视频轨道
private pendingVideoTracks: Map<string, any> = new Map();

// 🔧 新增：通知视频元素已准备好的回调
private onVideoElementReady?: (videoId: string) => void;

// 🔧 新增：设置视频元素准备好回调
setVideoElementReadyCallback(callback: (videoId: string) => void) {
  this.onVideoElementReady = callback;
}

// 🔧 新增：通知视频元素已准备好
notifyVideoElementReady(videoId: string) {
  console.log(`🎯 收到视频元素准备好通知: ${videoId}`);

  // 检查是否有等待播放的视频轨道
  const pendingTrack = this.pendingVideoTracks.get(videoId);
  if (pendingTrack) {
    console.log(`🎬 找到等待播放的视频轨道，开始播放: ${videoId}`);
    this.pendingVideoTracks.delete(videoId);
    this.playRemoteVideoToExistingElements(pendingTrack, videoId.replace('remote-', ''));
  }
}
```

#### 2. 改进重试机制

```typescript
// 🔧 改进：智能重试播放视频的逻辑
const tryPlayVideo = (attempt: number = 1, maxAttempts: number = 8) => {
  // ... 查找目标元素逻辑 ...

  if (!targetElement) {
    if (attempt < maxAttempts) {
      // 🔧 改进：使用指数退避策略，避免频繁重试
      const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000);
      console.log(`❌ 第 ${attempt} 次未找到用户 ${userId} 对应的video元素，${delay}ms后重试...`);
      setTimeout(() => tryPlayVideo(attempt + 1, maxAttempts), delay);
      return;
    } else {
      console.warn(`❌ 重试 ${maxAttempts} 次后仍未找到用户 ${userId} 对应的video元素`);
      // 🔧 改进：将轨道存储到等待队列中，等待UI通知
      const videoId = `remote-${userId}`;
      this.pendingVideoTracks.set(videoId, remoteVideoTrack);
      console.log(`📦 将轨道存储到等待队列: ${videoId}`);
      return;
    }
  }
  // ... 播放逻辑 ...
};
```

#### 3. 等待视频元素准备好

```typescript
// 🔧 新增：等待视频元素准备好
private waitForVideoElement(videoId: string, track: any, maxWaitTime: number = 10000) {
  console.log(`⏳ 等待视频元素准备好: ${videoId}`);

  const startTime = Date.now();
  const checkElement = () => {
    const targetSelector = `[data-video-id="${videoId}"] video, [data-video-id="${videoId}"].cui-callkit-video`;
    const targetElement = document.querySelector(targetSelector) as HTMLVideoElement;

    if (targetElement) {
      console.log(`✅ 视频元素已准备好: ${videoId}`);
      this.playRemoteVideoToExistingElements(track, videoId.replace('remote-', ''));
      return;
    }

    // 检查是否超时
    if (Date.now() - startTime > maxWaitTime) {
      console.warn(`⏰ 等待视频元素超时: ${videoId}`);
      // 回退到原来的重试机制
      this.playRemoteVideoToExistingElements(track, videoId.replace('remote-', ''));
      return;
    }

    // 继续等待
    setTimeout(checkElement, 100);
  };

  checkElement();
}
```

#### 4. 修改远程用户发布流处理

```typescript
// 通知有新的远程视频流
this.onRemoteVideoReady?.(remoteVideoInfo);

// 🔧 改进：使用事件驱动的方式等待视频元素准备好
const videoId = `remote-${user.uid}`;
this.pendingVideoTracks.set(videoId, remoteVideoTrack);

// 等待视频元素准备好，最多等待10秒
this.waitForVideoElement(videoId, remoteVideoTrack, 10000);
```

### 方案 2：延迟和重试（备选）

如果事件驱动方案不可行，可以改进现有的延迟和重试机制：

```typescript
// 改进的重试策略
const maxAttempts = 8; // 增加重试次数
const baseDelay = 500; // 基础延迟
const maxDelay = 5000; // 最大延迟

const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), maxDelay);
```

## 修复效果

### 修复前

- ❌ 固定延迟 500ms 后开始查找元素
- ❌ 简单线性重试（1s, 2s, 3s, 4s, 5s）
- ❌ 重试失败后直接放弃
- ❌ 无法处理 UI 渲染延迟

### 修复后

- ✅ 事件驱动，等待 UI 通知
- ✅ 智能指数退避重试（1s, 1.5s, 2.25s, 3.375s, 5s, 5s, 5s, 5s）
- ✅ 重试失败后存储到等待队列
- ✅ 支持 UI 通知后立即播放

## 测试方法

### 1. 使用测试页面

创建了 `demo/callkit/video-stream-fix-test.html` 测试页面，可以：

- 模拟 1v1 视频通话场景
- 测试远程视频流发布
- 验证事件驱动机制
- 查看重试和播放统计

### 2. 手动测试步骤

1. **启动测试**：

   - 点击 "开始 1v1 视频通话"
   - 观察本地视频是否正常显示

2. **模拟远程流**：

   - 点击 "模拟远程视频流"
   - 观察是否触发播放逻辑

3. **模拟元素准备好**：
   - 点击 "模拟视频元素准备好"
   - 观察是否成功播放视频

## 相关文件

- `module/callkit/services/CallService.ts` - 核心修复逻辑
- `module/callkit/CallKit.tsx` - 设置回调函数
- `demo/callkit/video-stream-fix-test.html` - 测试页面
- `docs/zh/CHANGELOG.md` - 更新日志

## 注意事项

1. **向后兼容**：修复不影响现有功能，只是改进了播放机制
2. **性能优化**：指数退避策略避免频繁重试
3. **超时保护**：最多等待 10 秒，避免无限等待
4. **事件驱动**：支持 UI 主动通知元素准备好

## 版本信息

- **修复版本**：1.2.1
- **影响范围**：1v1 视频通话中的远程视频流播放
- **兼容性**：完全向后兼容
- **性能影响**：轻微提升，减少不必要的重试
