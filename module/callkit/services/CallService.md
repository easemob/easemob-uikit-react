# CallService 扬声器控制功能修复

## 问题描述

在 1v1 视频通话中，当一个人关闭扬声器后，无法再次打开，另外一个人也无法关闭扬声器。另外，当通话结束时，扬声器状态没有被重置，导致下次通话时会继承上次的状态。还有一个问题是，被叫接听时扬声器按钮会从关闭状态变成打开状态，而不是默认就是打开状态。

## 问题原因

1. **状态检测不可靠**：原来的 `isSpeakerEnabled()` 方法依赖于 `getVolumeLevel()` 方法，但这个方法可能不存在或不可靠
2. **状态同步问题**：扬声器状态没有在用户之间同步，每个用户只能控制自己的音频轨道
3. **逻辑错误**：在 1v1 通话中，错误地控制了本地音频轨道的音量，这会导致自己的声音也被静音
4. **状态重置问题**：通话结束时没有重置扬声器状态，导致下次通话继承上次的状态

## 修复方案

### 1. 添加内部状态管理

```typescript
// 🔧 新增：扬声器状态管理
private speakerEnabled: boolean = true; // 内部扬声器状态
```

### 2. 修复状态检测逻辑

```typescript
// 🔧 新增：获取当前扬声器状态
isSpeakerEnabled(): boolean {
  return this.speakerEnabled;
}
```

### 3. 修复切换逻辑

```typescript
// 🔧 新增：切换扬声器状态
toggleSpeaker(): boolean {
  // 切换内部扬声器状态
  this.speakerEnabled = !this.speakerEnabled;
  const newSpeakerEnabled = this.speakerEnabled;

  // 控制所有远程音频轨道的音量
  this.remoteAudioTracks.forEach((audioTrack, userId) => {
    if (audioTrack && audioTrack.setVolume) {
      const volume = newSpeakerEnabled ? 100 : 0;
      audioTrack.setVolume(volume);
      console.log(`用户 ${userId} 音频轨道音量设置为:`, volume);
    }
  });

  // 注意：不应该控制本地音频轨道的音量，因为这会静音自己的声音
  // 扬声器控制只影响远程音频轨道的播放音量

  return newSpeakerEnabled;
}
```

### 4. 修复状态重置问题

```typescript
// 在 hangup 方法中重置扬声器状态
async hangup(reason: string = 'normal', isCancel: boolean = false) {
  // ... 其他清理逻辑 ...

  // 重置状态
  this.callStatus = CALL_STATUS.IDLE;
  this.currentCallInfo = null;
  this.callDuration = '00:00';
  this.joinedMembers = [];
  this.invitedMembers = [];
  this.localVideoStream = null;
  // 🔧 重置扬声器状态为默认开启
  this.speakerEnabled = true;
}

// 在 cleanupPreviewMode 方法中也重置扬声器状态
cleanupPreviewMode() {
  // ... 其他清理逻辑 ...

  // 🔧 重置扬声器状态为默认开启
  this.speakerEnabled = true;
}
```

## 功能说明

### 1v1 视频通话

- **关闭扬声器**：设置对方的音频轨道音量 = 0
- **开启扬声器**：设置对方的音频轨道音量 = 100
- **不影响自己**：不会控制本地音频轨道，确保自己的声音正常

### 多人视频通话

- **关闭扬声器**：设置所有人的音频轨道音量 = 0
- **开启扬声器**：设置所有人的音频轨道音量 = 100
- **不影响自己**：不会控制本地音频轨道

## 使用方式

```typescript
// 在 CallKit 中使用
const handleSpeakerToggle = React.useCallback(
  (newSpeakerEnabled: boolean) => {
    if (enableRealCall && callServiceRef.current) {
      // 使用 CallService 的实际扬声器控制方法
      const actualSpeakerEnabled = callServiceRef.current.toggleSpeaker();
      // 更新内部状态
      setRealCallSpeakerEnabled(actualSpeakerEnabled);
      // 触发外部回调，传递实际状态
      onSpeakerToggle?.(actualSpeakerEnabled);
    } else {
      // 演示模式，直接调用外部回调
      onSpeakerToggle?.(newSpeakerEnabled);
    }
  },
  [enableRealCall, onSpeakerToggle],
);
```

## 测试验证

1. **1v1 视频通话测试**：

   - 用户 A 关闭扬声器 → 用户 B 的声音被静音
   - 用户 A 开启扬声器 → 用户 B 的声音恢复
   - 用户 A 的声音始终正常

2. **多人视频通话测试**：

   - 用户 A 关闭扬声器 → 所有其他用户的声音被静音
   - 用户 A 开启扬声器 → 所有其他用户的声音恢复
   - 用户 A 的声音始终正常

3. **状态同步测试**：

   - 每个用户都能独立控制自己的扬声器状态
   - 状态切换后能正确反映在 UI 上
   - 状态在通话过程中保持稳定

4. **状态重置测试**：
   - 通话结束后，下次通话时扬声器状态默认为开启
   - 预览模式清理后，扬声器状态重置为开启
   - 不会继承上次通话的扬声器状态
