# API 概览

本文档详细介绍 CallKit 组件的所有属性、方法和回调事件。

## 组件属性 (Props)

### 基础配置

| 属性              | 类型                  | 默认值        | 描述   |
| ----------------- | --------------------- | ------------- | ---------- |
| `className`       | `string`              | -             | 自定义 CSS 类名。                                      |
| `style`           | `React.CSSProperties` | -             | 自定义内联样式。                                       |
| `prefix`          | `string`              | `cui`         | CSS 类名前缀。                                         |
| `chatClient`      | `ChatSDK.Connection`  | -             | **必须**，环信 IM SDK 实例。                           |
| `layoutMode`      | `LayoutMode`          | `MULTI_PARTY` | 布局模式：`PREVIEW`、`ONE_TO_ONE` 和 `MULTI_PARTY`。 |
| `maxVideos`       | `number`              | `16`          | 最大显示视频数量。                                    |
| `aspectRatio`     | `number`              | `1`           | 视频窗口宽高比。                                       |
| `gap`             | `number`              | `6`           | 视频窗口间隙（像素）。                                 |
| `backgroundImage` | `string`              | -             | 多人通话背景图片 URL。                                 |
| `userSelectTitle` | `string`              | -             | 用户选择弹窗标题。                                     |

### 铃声配置

| 属性                  | 类型      | 默认值 | 描述                     |
| --------------------- | --------- | ------ | ------------------------ |
| `enableRingtone`      | `boolean` | `true` | 是否启用铃声。            |
| `outgoingRingtoneSrc` | `string`  | -      | 拨打电话铃声音频文件路径。 |
| `incomingRingtoneSrc` | `string`  | -      | 接听电话铃声音频文件路径。 |
| `ringtoneVolume`      | `number`  | `0.8`  | 铃声音量，范围 0-1。       |
| `ringtoneLoop`        | `boolean` | `true` | 是否循环播放铃声。         |

### 窗口大小和位置

| 属性              | 类型                              | 默认值                      | 描述                 |
| ----------------- | --------------------------------- | --------------------------- | -------------------- |
| `resizable`       | `boolean`                         | `false`                     | 是否允许调整大小。     |
| `minWidth`        | `number`                          | `400`                       | 最小宽度（像素）。     |
| `minHeight`       | `number`                          | `300`                       | 最小高度（像素）。     |
| `maxWidth`        | `number`                          | -                           | 最大宽度（像素）。     |
| `maxHeight`       | `number`                          | -                           | 最大高度（像素）。     |
| `draggable`       | `boolean`                         | `true`                      | 是否允许拖拽。        |
| `dragHandle`      | `string`                          | -                           | 拖拽手柄 CSS 选择器。  |
| `managedPosition` | `boolean`                         | `true`                      | 是否使用内置位置管理。 |
| `initialPosition` | `{left: number, top: number}`     | -                           | 初始位置。             |
| `initialSize`     | `{width: number, height: number}` | `{width: 748, height: 523}` | 初始大小。             |
| `minimizedSize`   | `{width: number, height: number}` | `{width: 80, height: 64}`   | 最小化时的尺寸。       |

### 邀请界面配置

| 属性                      | 类型              | 默认值 | 描述               |
| ------------------------- | ----------------- | ------ | ------------------ |
| `invitationCustomContent` | `React.ReactNode` | -      | 自定义邀请内容。     |
| `acceptText`              | `string`          | -      | 接听按钮文本。       |
| `rejectText`              | `string`          | -      | 拒绝按钮文本。       |
| `showInvitationAvatar`    | `boolean`         | `true` | 是否显示邀请者头像。 |
| `showInvitationTimer`     | `boolean`         | `true` | 是否显示倒计时。     |
| `autoRejectTime`          | `number`          | `30`   | 自动拒绝时间（秒）。 |

### 信息提供者

| 属性                | 类型                                           | 默认值 | 描述               |
| ------------------- | ---------------------------------------------- | ------ | ------------------ |
| `userInfoProvider`  | `(userIds: string[]) => Promise<UserInfo[]>`   | -      | 用户信息提供者函数。 |
| `groupInfoProvider` | `(groupIds: string[]) => Promise<GroupInfo[]>` | -      | 群组信息提供者函数。 |

### 其他配置

| 属性                      | 类型             | 默认值 | 描述                           |
| ------------------------- | ---------------- | ------ | ------------------------------ |
| `speakingVolumeThreshold` | `number`         | `60`   | 说话指示器音量阈值，范围 1-100。 |
| `customIcons`             | `CallKitIconMap` | -      | 自定义图标映射。                 |

## 组件方法

通过 `ref` 调用以下方法：

```tsx
const callKitRef = useRef<CallKitRef>(null);
```

### 通话控制方法

| 方法              | 参数         | 返回值    | 描述       |
| ----------------- | -------------- | ---------------- | ------------ |
| `startSingleCall` | `{to: string, callType: 'video'\|'audio', msg: string}`     | `Promise<ChatSDK.TextMsgBody \| null>` | 发起一对一通话。视频通话时摄像头默认开启。  |
| `startGroupCall`  | `{groupId: string, msg: string, ext?: Record<string, any>}` | `Promise<ChatSDK.TextMsgBody \| null>` | 发起群组通话。群组通话时摄像头默认关闭，只创建音频轨道。 |
| `answerCall`      | `result: boolean`                                           | `void`                                 | 接听/拒绝通话。                                          |
| `exitCall`        | `reason?: string`                                           | `void`                                 | 退出通话。                                               |
| `adjustSize`      | `newSize: {width: number, height: number}`                  | `void`                                 | 动态调整窗口尺寸。                                       |

## 回调事件

### 通话状态回调

| 回调事件              | 参数                                                             | 返回值 | 触发时机                 |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------------ |
| `onCallStart`         | `videos: VideoWindowProps[]`                                     | `void` | 通话开始时。               |
| `onEndCallWithReason` | `reason: string, callInfo: CallInfo`                             | `void` | 通话结束时（包含详细原因）。 |
| `onReceivedCall`      | `callType: 'video'\|'audio'\|'group', userId: string, ext?: any` | `void` | 收到通话邀请时。           |
| `onCallError`         | `error: CallError`                                               | `void` | 通话过程中发生错误时。     |

### 用户状态回调

| 回调事件             | 参数                                                  | 返回值 | 触发时机           |
| -------------------- | ----------------------------------------------------- | ------ | ------------------ |
| `onRemoteUserJoined` | `userId: string, callType: 'video'\|'audio'\|'group'` | `void` | 远程用户加入通话时。 |
| `onRemoteUserLeft`   | `userId: string, callType: 'video'\|'audio'\|'group'` | `void` | 远程用户离开通话时。 |

### 邀请处理回调

| 回调事件             | 参数                         | 返回值 | 触发时机       |
| -------------------- | ---------------------------- | ------ | -------------- |
| `onInvitationAccept` | `invitation: InvitationInfo` | `void` | 用户接受邀请时。 |
| `onInvitationReject` | `invitation: InvitationInfo` | `void` | 用户拒绝邀请时。 |

### 界面状态回调

| 回调事件             | 参数                           | 返回值 | 触发时机         |
| -------------------- | ------------------------------ | ------ | ---------------- |
| `onLayoutModeChange` | `layoutMode: 'grid' \| 'main'` | `void` | 布局模式变化时。   |
| `onMinimizedChange`  | `minimized: boolean`           | `void` | 最小化状态变化时。 |
| `onMinimizedToggle`  | -                              | `void` | 最小化切换时。     |

### 窗口操作回调

| 回调事件      | 参数                      | 返回值 | 触发时机       |
| ------------- | -------------------------- | ------ | -------------- |
| `onResize`    | `width: number, height: number, deltaX?: number, deltaY?: number, direction?: string` | `void` | 窗口大小调整时。 |
| `onDragStart` | `startPosition: {x: number, y: number}`                                               | `void` | 开始拖拽时。     |
| `onDrag`      | `newPosition: {x: number, y: number}, delta: {x: number, y: number}`                  | `void` | 拖拽过程中。     |
| `onDragEnd`   | `finalPosition: {x: number, y: number}`                                               | `void` | 拖拽结束时。     |

### 技术回调

| 回调事件             | 参数       | 返回值 | 触发时机           |
| -------------------- | ---------- | ------ | ------------------ |
| `onRtcEngineCreated` | `rtc: any` | `void` | RTC 引擎创建完成时。 |

## 类型定义

### UserInfo

```tsx
interface UserInfo {
  userId: string;
  nickname?: string;
  avatarUrl?: string;
}
```

### GroupInfo

```tsx
interface GroupInfo {
  groupId: string;
  groupName?: string;
  groupAvatar?: string;
}
```

### 通话错误

通话错误（`CallError`）类型 `errorType` 分为声网 RTC 错误、IM 错误以及 CallKit 本身的错误。

| 通话错误类型 | 描述 |
| :--------- | :----- |
| `rtc`  | 音视频异常，详见 [声网 RTC 错误码](https://doc.shengwang.cn/doc/rtc/web/error-code)。 |
| `chat`  | 即时通讯 IM 异常，详见 [环信即时通讯 IM 错误码](/document/web/error.html)。  |
| `callkit`  | `CallErrorCode` 类中包含三种错误类型：<br/> - `CALL_STATE_ERROR`：通话状态错误<br/> - `CALL_PARAM_ERROR`：通话参数错误<br/> - `CALL_SIGNALING_ERROR`：信令错误 |

## 通话结束原因  

通话结束原因  `HANGUP_REASON` 如下表所示：

| 枚举值                | 英文名称               | 描述             | 触发场景  |
| --------------------- | ---------------------- | ---------------- | -------- |
| `hangup`              | HANGUP                 | 挂断通话。         | 用户主动挂断正在进行的通话。               |
| `cancel`              | CANCEL                 | 取消呼叫。        | 发起者在对方接听前取消通话。               |
| `remoteCancel`        | REMOTE_CANCEL          | 对方取消呼叫。     | 对方发起者在接听前取消了通话。             |
| `refuse`              | REFUSE                 | 自己拒绝呼叫。     | 被叫方主动拒绝接听通话。                   |
| `remoteRefuse`        | REMOTE_REFUSE          | 对方拒绝呼叫。     | 对方被叫方拒绝接听通话。                   |
| `busy`                | BUSY                   | 忙碌。             | 被叫方当前正在通话中，无法接听新通话。     |
| `noResponse`          | NO_RESPONSE            | 无响应。           | 自己超时未处理通话邀请。                   |
| `remoteNoResponse`    | REMOTE_NO_RESPONSE     | 对方无响应。       | 对方超时未接听通话。                       |
| `handleOnOtherDevice` | HANDLE_ON_OTHER_DEVICE | 已在其他设备处理。 | 通话已在其他设备上被接听或处理。           |
| `abnormalEnd`         | ABNORMAL_END           | 异常结束。         | 由于网络异常、设备问题等导致通话异常结束。 |
