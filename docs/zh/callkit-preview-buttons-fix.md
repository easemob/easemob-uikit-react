# CallKit 预览模式按钮修复

## 问题描述

在 1v1 视频通话的预览模式下，主叫方显示的按钮是 "Reject"，但点击时并没有真正挂断通话，而是调用了错误的方法。这导致用户体验混乱，因为：

1. **主叫方**应该显示 "End" 按钮，点击时真正挂断通话
2. **被叫方**应该显示 "Reject" 按钮，点击时拒绝邀请

## 修复内容

### 1. 修正 CallControls 组件按钮逻辑

在 `module/callkit/components/CallControls.tsx` 中，修改了预览模式下的按钮显示逻辑：

```typescript
// 预览模式下的按钮布局
if (isPreview) {
  return (
    <div className={rootClass} style={style}>
      {/* 主叫方显示挂断按钮，被叫方显示拒绝按钮 */}
      <div className={classNames(`${prefixCls}-button-group`)}>
        <button
          className={classNames(`${prefixCls}-button`, `${prefixCls}-button-hangup`)}
          onClick={isCaller ? handleHangupClick : handleRejectClick}
          title={isCaller ? '挂断' : '拒绝'}
        >
          <Icon type="X_MARK_THICK" width={24} height={24} color={'#F9FAFA'} />
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>{isCaller ? 'End' : 'Reject'}</div>
      </div>
      // ... 其他按钮
    </div>
  );
}
```

### 2. 修正 handlePreviewReject 函数

在 `module/callkit/CallKit.tsx` 中，修正了被叫方拒绝邀请时的处理逻辑：

```typescript
const handlePreviewReject = () => {
  setIsShowingPreview(false);
  setCallStatus('idle');
  setInvitation(null);
  setLocalVideo(null);
  setCallMode(propCallMode || 'video');

  if (invitation) {
    onInvitationRejectRef.current?.(invitation);
  }

  if (callServiceRef.current) {
    // 被叫方拒绝邀请时，调用 answerCall(false) 发送 refuse 消息
    callServiceRef.current.answerCall(false);
  }
};
```

### 3. 修正 handleHangup 函数

在 `module/callkit/CallKit.tsx` 中，修正了主叫方挂断时的处理逻辑，确保在预览模式下发送取消消息：

```typescript
const handleHangup = React.useCallback(() => {
  if (enableRealCall && callServiceRef.current) {
    // 使用 CallService 挂断真实通话
    // 🔧 在预览模式下，主叫方点击 "End" 按钮时，应该发送取消消息给对方
    const isInPreviewMode = isShowingPreview && callStatus === 'calling';
    callServiceRef.current.hangup('normal', isInPreviewMode);
  } else {
    // 演示模式，重置组件状态
    setVideos([]);
    setIsInCall(false);
    setCallStatus('idle');
    setIsShowingPreview(false);
    setLocalVideo(null);
    setInvitation(null);
    setCallMode(propCallMode || 'video');
  }
  // 触发外部回调
  onHangup?.();
}, [enableRealCall, onHangup, isShowingPreview, callStatus]);
```

## 修复后的行为

### 主叫方预览模式

- **显示按钮**：`End`
- **点击行为**：调用 `CallService.hangup('normal', true)` 发送取消消息给对方
- **UI 状态**：重置为初始状态

### 被叫方预览模式

- **显示按钮**：`Reject`
- **点击行为**：调用 `CallService.answerCall(false)` 发送 refuse 消息
- **UI 状态**：重置为初始状态

## 测试方法

### 1. 使用演示页面

创建了 `demo/callkit/hangup-signal-test.html` 演示页面，可以：

- 测试主叫方预览模式下的挂断信令
- 验证是否正确发送取消消息
- 查看操作日志和信令流程

### 2. 手动测试步骤

1. **主叫方测试**：

   - 设置通话状态为 "calling"
   - 点击 "开始预览"
   - 验证显示 "End" 按钮
   - 点击按钮验证调用 `CallService.hangup()`

2. **被叫方测试**：
   - 设置通话状态为 "ringing"
   - 点击 "开始预览"
   - 验证显示 "Reject" 按钮
   - 点击按钮验证调用 `CallService.answerCall(false)`

## 相关文件

- `module/callkit/components/CallControls.tsx` - 按钮显示逻辑
- `module/callkit/CallKit.tsx` - 回调函数处理
- `module/callkit/services/CallService.ts` - 底层服务方法
- `demo/callkit/hangup-signal-test.html` - 挂断信令测试页面
- `docs/zh/CHANGELOG.md` - 更新日志

## 注意事项

1. **向后兼容**：修复不影响现有功能，只是修正了错误的按钮显示
2. **类型安全**：所有修改都保持了 TypeScript 类型安全
3. **测试覆盖**：建议在真实环境中测试主叫方和被叫方的完整流程
4. **文档更新**：已更新相关文档和演示页面

## 版本信息

- **修复版本**：1.2.1
- **影响范围**：1v1 视频通话预览模式
- **兼容性**：完全向后兼容
