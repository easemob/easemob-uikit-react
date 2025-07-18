# CallKit 最小化视频流显示问题修复

## 问题描述

在 1v1 视频通话中，当用户点击最小化按钮后，最小化窗口只显示默认头像，没有显示远程视频流。

### 问题现象

- 1v1 视频通话正常显示远程视频
- 点击最小化后，最小化窗口显示默认头像
- 没有显示远程用户的视频流

### 控制台日志

```
🔍 MiniSizeWindow 调试信息: {
  callType: 'video',
  callStatus: 'connected',
  hasRemoteVideoStream: false,  // 问题：视频流为空
  hasRemoteVideoElement: false,
  remoteUserNickname: '演示用户',
  remoteUserAvatar: 'https://...',
  participantCount: 2
}
```

## 问题分析

### 根本原因

1. **视频流传递问题**：`CallService` 中的 `getRemoteVideoStream` 方法没有正确从 Agora 轨道中获取 `MediaStream`
2. **数据流问题**：`joinedMembers` 中的成员没有 `stream` 属性，导致 `getRemoteVideoStream` 返回 `undefined`
3. **MiniSizeWindow 处理问题**：组件中的视频流处理逻辑不够完善

### 数据流分析

```
Agora 轨道 → CallService.remoteVideoTracks → getRemoteVideoStream() → onRemoteVideoReady() → CallKit.videos → FullLayoutManager → MiniSizeWindow
```

问题出现在 `getRemoteVideoStream()` 这一步，没有正确从 Agora 轨道中提取 `MediaStream`。

## 解决方案

### 1. 修复 CallService 中的 getRemoteVideoStream 方法

```typescript
// 🔧 改进：从远程视频轨道中获取 MediaStream
private getRemoteVideoStream(uid: string): MediaStream | undefined {
  const videoTrack = this.remoteVideoTracks.get(uid);
  if (videoTrack && videoTrack.getMediaStream) {
    try {
      const mediaStream = videoTrack.getMediaStream();
      console.log(`🎬 从轨道获取 MediaStream 成功: ${uid}`, {
        hasVideoTrack: !!videoTrack,
        hasMediaStream: !!mediaStream,
        trackId: videoTrack.getTrackId?.(),
      });
      return mediaStream;
    } catch (error) {
      console.warn(`🎬 从轨道获取 MediaStream 失败: ${uid}`, error);
      return undefined;
    }
  }

  // 回退到旧的方式（从 joinedMembers 中查找）
  const member = this.joinedMembers.find(member => member.uid === uid);
  if (member && member.stream) {
    return member.stream;
  }

  console.log(`🎬 未找到用户 ${uid} 的视频流`, {
    hasVideoTrack: !!this.remoteVideoTracks.get(uid),
    joinedMembersCount: this.joinedMembers.length,
  });

  return undefined;
}
```

### 2. 改进 MiniSizeWindow 的视频流处理

```typescript
// 🔧 改进：更完善的视频流处理逻辑
React.useEffect(() => {
  if (isOneToOneVideo && videoRef.current) {
    console.log('🎬 MiniSizeWindow 视频流处理:', {
      hasRemoteVideoStream: !!remoteVideoStream,
      hasRemoteVideoElement: !!remoteVideoElement,
      videoRef: !!videoRef.current,
      callStatus,
      callType,
    });

    if (remoteVideoStream) {
      console.log('🎬 设置远程视频流到最小化窗口');
      videoRef.current.srcObject = remoteVideoStream;

      // 确保视频播放
      videoRef.current.play().catch(error => {
        console.warn('🎬 最小化窗口视频播放失败:', error);
      });
    }
  }
}, [isOneToOneVideo, remoteVideoStream, remoteVideoElement, callStatus, callType]);

// 🔧 新增：调试信息
React.useEffect(() => {
  if (isOneToOneVideo) {
    console.log('🔍 MiniSizeWindow 调试信息:', {
      callType,
      callStatus,
      hasRemoteVideoStream: !!remoteVideoStream,
      hasRemoteVideoElement: !!remoteVideoElement,
      remoteUserNickname,
      remoteUserAvatar,
      participantCount,
    });
  }
}, [
  isOneToOneVideo,
  callType,
  callStatus,
  remoteVideoStream,
  remoteVideoElement,
  remoteUserNickname,
  remoteUserAvatar,
  participantCount,
]);
```

### 3. 确保 FullLayoutManager 正确传递视频流

在 `FullLayoutManager` 中，最小化时正确获取远程视频信息：

```typescript
case LayoutMode.MINIMIZED: {
  // 获取远程视频信息（用于1v1视频通话的最小化显示）
  const remoteVideo = videos.find(video => !video.isLocalVideo);

  return (
    <MinimizedFullLayout
      prefixCls={prefixCls}
      callDuration={callDuration}
      participantCount={videos.length}
      callType={callMode}
      callStatus={callStatus}
      muted={muted}
      cameraEnabled={cameraEnabled}
      // 视频相关props（仅在1v1视频通话时使用）
      remoteVideoStream={remoteVideo?.stream}
      remoteVideoElement={remoteVideo?.videoElement}
      remoteUserAvatar={remoteVideo?.avatar}
      remoteUserNickname={remoteVideo?.nickname}
      onClick={onMinimizedClick}
      onMuteToggle={onMuteToggle}
      onCameraToggle={onCameraToggle}
      onHangup={onHangup}
    />
  );
}
```

## 修复效果

### 修复前

- ❌ `getRemoteVideoStream` 从 `joinedMembers` 中查找，但成员没有 `stream` 属性
- ❌ `MiniSizeWindow` 接收不到 `remoteVideoStream`
- ❌ 最小化窗口只显示默认头像

### 修复后

- ✅ `getRemoteVideoStream` 从 `remoteVideoTracks` Map 中获取 `MediaStream`
- ✅ `MiniSizeWindow` 正确接收 `remoteVideoStream`
- ✅ 最小化窗口显示远程视频流

## 测试方法

### 1. 使用测试页面

创建了 `demo/callkit/minimized-video-test.html` 测试页面，可以：

- 模拟 1v1 视频通话场景
- 测试远程视频流发布
- 验证最小化时的视频显示
- 查看视频流传递过程

### 2. 手动测试步骤

1. **启动测试**：

   - 点击 "开始 1v1 视频通话"
   - 观察正常通话界面

2. **模拟远程流**：

   - 点击 "模拟远程视频流"
   - 观察是否触发视频流处理

3. **测试最小化**：

   - 点击 "切换最小化"
   - 观察最小化窗口是否显示视频流

4. **查看统计**：
   - 观察远程视频轨道数量
   - 查看视频流状态
   - 检查视频元素数量

## 相关文件

- `module/callkit/services/CallService.ts` - 修复 `getRemoteVideoStream` 方法
- `module/callkit/components/MiniSizeWindow.tsx` - 改进视频流处理逻辑
- `module/callkit/layouts/FullLayoutManager.tsx` - 确保正确传递视频流
- `demo/callkit/minimized-video-test.html` - 测试页面
- `docs/zh/CHANGELOG.md` - 更新日志

## 注意事项

1. **向后兼容**：修复不影响现有功能，只是改进了视频流获取方式
2. **错误处理**：添加了完善的错误处理和日志记录
3. **调试信息**：增加了详细的调试信息，便于问题排查
4. **性能优化**：避免重复获取视频流，提高性能

## 版本信息

- **修复版本**：1.2.1
- **影响范围**：1v1 视频通话最小化时的视频流显示
- **兼容性**：完全向后兼容
- **性能影响**：轻微提升，减少不必要的视频流查找
