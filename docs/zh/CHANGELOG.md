# 1.2.1

### 新增特性

- CallKit 新增 `backgroundImage` 参数，支持为多人视频通话和 1v1 语音通话设置自定义背景图片
- 修复 1v1 视频通话渐变遮罩显示问题，改用阴影方案确保兼容性
- 新增事件驱动的视频播放机制，解决 1v1 视频流播放时序问题
- 新增智能重试和等待队列机制，提升视频播放成功率

### 修复

- 解决 video 元素特殊渲染层级导致的 z-index 覆盖问题
- 修复 1v1 视频预览模式下主叫方显示错误按钮的问题
  - 主叫方预览模式现在显示 "End" 按钮，点击时调用 `CallService.hangup('normal', true)` 发送取消消息给对方
  - 被叫方预览模式显示 "Reject" 按钮，点击时调用 `CallService.answerCall(false)` 拒绝邀请
  - 修正了 `CallControls` 组件中预览模式下的按钮逻辑
  - 修正了 `handlePreviewReject` 函数，被叫方拒绝时调用正确的方法
  - 修正了 `handleHangup` 函数，主叫方在预览模式下发送取消信令
- 修复 1v1 视频通话中远程视频流播放失败的问题
  - 修复视频元素查找时序问题，避免找不到对应 video 元素
  - 改进视频播放重试机制，使用指数退避策略（1s, 1.5s, 2.25s, 3.375s, 5s, 5s, 5s, 5s）
  - 新增等待队列机制，重试失败后将轨道存储到队列中等待 UI 通知
  - 支持 UI 主动通知视频元素准备好，立即播放等待中的轨道
- 修复 1v1 视频通话最小化后不显示远程视频流的问题
  - 改进 CallService 中的 getRemoteVideoStream 方法，从 remoteVideoTracks 中获取 MediaStream
  - 改进 MiniSizeWindow 组件的视频流处理逻辑，增加调试信息
  - 确保 FullLayoutManager 正确传递视频流到最小化窗口

# 1.2.0

### 新增特性

- Provider 中 primaryColor 支持配置 hue 颜色值
- 支持单条消息转发
- thread 中支持视频消息和名片消息
- 群详情支持展示头像。
- 联系人列表支持展示头像
- 会话列表支持展示群组头像
- 个人信息页面增加音视频呼叫按钮
- 增加消息举报功能
- AddressStore 增加 updateGroupAvatar 方法，来设置群组头像

### 修复

- 修复获取群成员属性超限的错误
- 修复被引用的语音消息不能播发
- 修复有时无法获取会话列表

### 优化

- 修改 VideoMessage， ImageMessage, UserCardMessage 样式， 消息时间位置。
- 修改 Modal， Badge 样式。
- 语音消息过长影响布局。
- thread 中文本消息过长影响布局。
- GroupDetail 情支持展示头像。
- Header 组件增加点击更多按钮的回调 onClickEllipsis
- Input 组件增减 onFocus, onBlur, ref 参数。
- UserSelect 增加 disabled 参数
- 优化消息列表组件性能
- 优化 dark 主题下的组件样式

### 重大变更
