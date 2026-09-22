# CallKit 原生呼叫信令迁移与重构计划

> 状态：实施中（Phase 0～3 已完成基础迁移，Phase 4～6 待继续）  
> 更新时间：2026-09-22  
> 目标 SDK：提供 `CallSignalingManager` 的 `easemob-websdk` 版本  
> 影响范围：`module/callkit/`、`module/store/`、`module/SDK.ts`、`module/chat/Chat.tsx`

## 1. 背景

当前 CallKit 使用普通 IM 文本/命令消息承载呼叫信令，在
`CallService.ts` 内同时处理以下职责：

- 邀请、响铃、接听、拒绝、忙线、取消和挂断信令；
- 单呼与群呼参与者状态；
- 多设备确认；
- Agora RTC client、token、频道、轨道和远端用户；
- 铃声、计时器、超时、资源清理；
- CallKit UI 回调和部分业务状态。

这使 `CallService` 同时承担协议、状态机、RTC 和 UI 编排，文件体积过大，
并且呼叫状态依赖普通聊天消息的到达顺序。

Web SDK 已提供原生 `CallSignalingManager`。本次迁移使用 Fusion 呼叫信令和
服务端权威 `CallSnapshot` 替换现有 IM 消息信令，同时拆分 `CallService`。

## 2. 已确认的产品决策

本计划以下列决策为前提，不再保留兼容分支：

1. 允许破坏性升级，不兼容旧版 CallKit 信令和旧版 CallKit API。
2. 本期不生成呼叫记录消息，不向聊天消息列表插入邀请或通话结果。
3. 本期不支持取消单个群成员邀请；群成员邀请等待接听、拒绝或超时。
4. 不做 legacy/native 双协议开关，不双发普通 IM 信令。
5. `CallSnapshot.callId` 同时作为 CallKit call ID 和 Agora RTC channel name。
6. 呼叫状态以服务端快照和呼叫信令事件为准，RTC 回调只维护媒体连接状态。

## 3. 目标与非目标

### 3.1 目标

- 使用 `CallSignalingManager` 完成单呼和群呼的全部呼叫信令。
- 正确接收在线邀请和登录后拉取的离线邀请。
- 使用服务端参与者快照处理接听、拒绝、忙线、超时、离开和多端处理。
- 保留现有 Agora RTC 能力、音视频控制、铃声、布局和用户资料展示。
- 将当前 `CallService` 拆分为职责单一、可独立测试的模块。
- 删除普通 IM 消息中的 CallKit 信令协议及其监听代码。

### 3.2 非目标

- 不生成或更新聊天中的呼叫记录消息。
- 不兼容旧版基于 `ext.action = rtcCall` 的信令。
- 不支持取消指定群成员的未处理邀请。
- 不实现浏览器整页刷新后的进行中通话恢复。
- 在 SDK 未明确 RTC event 整数协议前，不接入 `reportRtcEvent()`。

## 4. SDK 能力映射

| CallKit 当前行为 | 迁移后的 SDK API / 事件 |
| --- | --- |
| 发送单呼/群呼邀请消息 | `createCall()` |
| 发送响铃与 confirmRing | `reportRinging()`；删除 confirmRing |
| 单呼接听 | `acceptCall()` |
| 群呼加入 | `joinCall()` |
| 拒绝或主动忙线 | `rejectCall({ reason: 'declined' \| 'busy' })` |
| 主叫在接听前取消呼叫 | `cancelCall()` |
| 单呼接通后挂断 | `terminateCall()` |
| 群呼成员退出 | `leaveCall()` |
| 群呼追加邀请 | `inviteParticipants()` |
| 成员接听、拒绝、超时、离开 | `onParticipantsChanged` |
| 其他设备已处理来电 | `onHandledOnOtherDevice` |
| 整场呼叫结束 | `onCallEnded` |
| 来电消息监听 | `onInvitationReceived` |
| 随机 `callId` + `channelName` | `CallSnapshot.callId` |

CallKit 模式映射：

| CallKit 模式 | `kind` | `mediaType` |
| --- | --- | --- |
| `AUDIO_1V1` | `single` | `voice` |
| `VIDEO_1V1` | `single` | `video` |
| `AUDIO_MULTI` | `conference` | `voice` |
| `VIDEO_MULTI` | `conference` | `video` |

## 5. 目标架构

```text
Provider
  ├─ ChatClient + CallSignalingManager
  ├─ CallStore
  └─ CallSignalingService
       └─ 登录前注册 SDK 事件，事件写入 CallStore

CallKit
  └─ CallCoordinator
       ├─ CallSignalingService  呼叫命令
       ├─ CallStore             权威 UI/信令状态
       ├─ CallRtcService        Agora 连接与远端用户
       ├─ CallMediaService      本地轨道与设备控制
       └─ CallAudioService      铃声与提示音
```

### 5.1 建议目录

```text
module/callkit/
  CallKit.tsx
  controller/
    CallCoordinator.ts
  signaling/
    CallSignalingService.ts
    callExt.ts
    participantDiff.ts
  rtc/
    CallRtcService.ts
    CallMediaService.ts
  audio/
    CallAudioService.ts
  store/
    CallStore.ts
    types.ts
  types/
    index.ts
  utils/
  style/
```

命名可以在实现阶段按现有代码进一步调整，但职责边界不得重新合并到一个
超大 Service 中。

### 5.2 模块职责

#### `CallStore`

CallKit 的唯一运行时状态源，建议使用 MobX 并挂到 `rootStore`：

- 当前 `CallSnapshot`；
- 当前用户角色：`caller | callee`；
- 信令阶段；
- RTC 阶段；
- 当前邀请人资料；
- 群资料和参与者展示资料；
- 本地媒体状态；
- 是否显示来电、呼出、通话中和最小化窗口；
- 当前错误和结束原因。

Store 不直接发送网络请求，也不持有 Agora client。

建议显式区分两套状态：

```ts
type CallSignalingPhase =
  | 'idle'
  | 'inviting'
  | 'ringing'
  | 'accepted'
  | 'ended';

type CallRtcPhase =
  | 'idle'
  | 'joining'
  | 'joined'
  | 'leaving';
```

不得使用 RTC `user-joined`、`user-left` 等事件直接推导呼叫已经接听或结束。

#### `CallSignalingService`

仅封装 `CallSignalingManager`：

- 在登录动作发生前注册固定 ID 的事件处理器；
- 将 SDK 事件转换为 Store action；
- 封装创建、响铃、接听、拒绝、取消、加入、离开、终止和追加邀请；
- 处理 CallKit ext 序列化、长度校验和 SDKError 转换；
- 不操作 Agora、不播放铃声、不直接控制 React UI。

#### `CallRtcService`

从旧 `CallService` 提取：

- Agora client 生命周期；
- 获取 RTC token；
- 使用 `snapshot.callId` 加入频道；
- publish/unpublish；
- 远端用户订阅、RTC UID 映射；
- 网络质量和音量事件；
- 离开频道及幂等清理。

#### `CallMediaService`

从旧 `CallService` 提取：

- 麦克风和摄像头轨道的创建、启停与销毁；
- 视频预览；
- mute/camera 状态；
- 切换设备；
- 浏览器权限错误转换。

#### `CallAudioService`

从旧 `CallService` 提取：

- 呼出铃声；
- 来电铃声；
- 结束提示音；
- 浏览器自动播放恢复；
- 所有音频资源的幂等停止和销毁。

#### `CallCoordinator`

负责业务用例编排：

- SDK 信令状态与 RTC 生命周期的衔接；
- 主叫、被叫、单呼、群呼的流程差异；
- CallKit 对外 imperative API；
- 在结束事件到达时依次停止铃声、退出 RTC、销毁媒体资源和重置 Store；
- 保证同一个操作不会重复发送信令或重复释放资源。

Coordinator 不解析普通聊天消息。

## 6. 事件注册和初始化顺序

离线邀请会在登录后通过 Fusion 连接立即拉取，因此事件监听不能等到
`CallKit` 组件挂载。

要求初始化顺序如下：

1. `ChatClient.init()` 注册 `CallSignalingManager`。
2. Provider 创建 `CallStore` 和 `CallSignalingService`。
3. `CallSignalingService.start()` 同步注册 SDK event handler。
4. Provider 才允许执行自动登录。
5. 登录后 Manager 握手并拉取离线邀请。
6. 即使 `CallKit` 尚未挂载，邀请也会保存在 `CallStore`。
7. `CallKit` 挂载后观察 Store 并恢复来电 UI。

退出登录或 Provider 卸载时：

- 移除固定 ID 的事件处理器；
- 停止铃声；
- 离开 RTC；
- 销毁本地轨道；
- 清空 CallStore。

开发阶段需要增加断言或测试，确保自动登录 effect 不会早于事件注册执行。

## 7. 核心流程

### 7.1 主叫发起单呼

1. 校验当前没有活动呼叫。
2. 调用 `createCall({ kind: 'single', ... })`。
3. 将返回的 `CallSnapshot` 写入 Store。
4. 设置 `callId = snapshot.callId`、`channel = snapshot.callId`。
5. 显示呼出 UI 并播放呼出铃声。
6. 等待 `onParticipantsChanged` 中目标用户变为 `accepted`。
7. 停止呼出铃声，获取该 callId 的 RTC token 并加入 Agora。
8. 收到拒绝、忙线、超时或 `onCallEnded` 时执行统一清理。

### 7.2 被叫接收单呼

1. `onInvitationReceived` 写入邀请和 inviter 资料。
2. 立即调用 `reportRinging(callId)`。
3. 显示来电 UI 并播放来电铃声。
4. 用户接听：调用 `acceptCall(callId)`，成功后加入 RTC。
5. 用户拒绝：调用 `rejectCall(callId, { reason: 'declined' })`。
6. 收到 `onHandledOnOtherDevice` 时关闭当前设备的来电 UI。
7. 收到 `onCallEnded` 时执行统一清理。

Manager 的自动忙线作为主要保护；CallStore 仍只允许一个本地活动呼叫。

### 7.3 发起群呼

1. 保留现有群成员选择 UI。
2. 用户确认后调用
   `createCall({ kind: 'conference', targetUserIds, conversationId: groupId })`。
3. 以返回的 callId 作为 Agora channel。
4. 主叫创建呼叫成功后立即加入 RTC。
5. 参与者状态完全由 `onParticipantsChanged` 的完整列表驱动。
6. 邀请失败、拒绝、忙线或超时的成员从等待区域移除或显示最终状态。

如果用户在成员选择阶段取消，返回 `null`，且不创建信令呼叫。

### 7.4 被叫加入群呼

1. 收到邀请后上报 `reportRinging()`。
2. 用户接听时调用 `joinCall()`，不要调用单呼的 `acceptCall()`。
3. `joinCall()` 成功后加入 Agora。
4. 用户拒绝时调用 `rejectCall()`。
5. 用户主动退出时调用 `leaveCall()` 并释放本地 RTC/媒体资源。

群呼的 `joinCall()` 行为需要在接入目标 SDK 版本后用真实服务端做一次契约验证。

### 7.5 继续邀请群成员

1. 从快照中排除已存在的参与者。
2. 调用 `inviteParticipants(callId, { userIds, timeoutSeconds, ... })`。
3. 由 `onParticipantsChanged` 更新等待成员。
4. 删除 `cancelInvitation(userId)` 及相关 UI 操作。
5. 已发送的单个邀请不能手动撤销，只能等待成员处理或超时。

### 7.6 挂断与结束

根据服务端状态选择唯一信令动作：

| 场景 | 动作 |
| --- | --- |
| 主叫在单呼接听前取消 | `cancelCall()` |
| 被叫拒绝未接来电 | `rejectCall()` |
| 已接通单呼任一方挂断 | `terminateCall()` |
| 群呼成员退出 | `leaveCall()` |
| 服务端通知整场结束 | 不再发命令，只执行本地清理 |

所有路径最终进入同一个幂等 `cleanupCall()`。清理本身不得再次发送信令，
避免 `exitCall()`、RTC `user-left` 和 `onCallEnded` 重复触发挂断。

## 8. 数据模型与公开 API 的破坏性调整

### 8.1 `CallInfo`

删除：

- `inviteMessageId`
- 独立 `channel`
- `callerDevId`
- `calleeDevId`
- 普通 IM invitation message 相关字段

新增或收敛：

```ts
interface CallInfo {
  callId: string;
  kind: 'single' | 'conference';
  mediaType: 'voice' | 'video';
  role: 'caller' | 'callee';
  conversationId?: string;
  snapshot: CallSnapshot;
  inviter?: Sender;
  groupId?: string;
}
```

RTC channel 始终通过 `callId` 获取，不在状态中保存第二份字段。

### 8.2 CallKit ref API

建议调整为：

```ts
startSingleCall(options: {
  to: string;
  callType: 'video' | 'audio';
  pushTitle?: string;
  pushContent?: string;
  ext?: CallKitExt;
}): Promise<CallSnapshot>;

startGroupCall(options: {
  groupId: string;
  callType: 'video' | 'audio';
  pushTitle?: string;
  pushContent?: string;
  ext?: CallKitExt;
}): Promise<CallSnapshot | null>;

answerCall(accept: boolean): Promise<void>;
exitCall(): Promise<void>;
addParticipants(userIds: string[]): Promise<CallSnapshot>;
```

- `start*Call()` 不再返回 `ChatSDK.Message`。
- `answerCall()`、`exitCall()` 改为 Promise，使调用方可以处理 SDK 错误。
- 删除公开或内部 `cancelInvitation(userId)`。
- 调用方不得把 start 返回值插入 MessageStore。

### 8.3 业务 ext

SDK 的 `ext` 是 UTF-8 字符串且最大 2KB。CallKit 对外可以保留结构化对象，
但必须统一序列化：

```ts
interface CallKitExt {
  version: 1;
  custom?: Record<string, unknown>;
}
```

群 ID 使用 `conversationId`，群名称和头像通过现有 groupInfo provider 补全，
不把易变化的展示资料作为信令真相。

## 9. 具体实施任务

### Phase 0：依赖与契约确认

- [ ] 确认 npm 中包含目标 `CallSignalingManager` 的 SDK 版本。
- [ ] 升级 `easemob-websdk`，确认 subpath export
      `easemob-websdk/managers/call-signaling` 可用。
- [ ] 确认目标服务端已部署与 SDK 一致的呼叫信令协议。
- [ ] 用真实环境确认群呼被叫使用 `joinCall()` 的契约。
- [ ] 记录 `CallSnapshot`、错误码和五类事件的实际 payload fixture。

完成标准：UIKit 可以完成类型编译，最小脚本可在登录前注册 Manager handler。

### Phase 1：建立 Store 和早期事件桥

- [x] 新增 `CallStore` 并挂入 `rootStore`。
- [x] 新增 `CallSignalingService`。
- [x] 在 `module/SDK.ts` 注册并导出 `CallSignalingManager`。
- [x] 调整 UIKit client 类型，使 `client.callSignalingManager` 类型可见。
- [x] 在 Provider 自动登录之前启动信令事件监听。
- [ ] 实现 Provider 卸载和 logout 清理。
- [ ] 为“离线邀请早于 CallKit 挂载”添加自动化测试。

完成标准：CallKit 不挂载时登录，离线邀请仍能进入 CallStore；随后挂载可显示来电。

### Phase 2：拆分 RTC、Media 和 Audio

- [ ] 从 `CallService` 提取 `CallRtcService`。
- [ ] 提取本地轨道和设备控制到 `CallMediaService`。
- [ ] 提取铃声和音频自动播放处理到 `CallAudioService`。
- [ ] 为三者定义明确的 `dispose()`，并保证重复调用安全。
- [ ] 保持现有视频窗口、mute、camera 和远端订阅行为不变。
- [ ] 为 RTC join/leave 和轨道清理添加单元测试。

完成标准：旧信令尚未删除时，RTC 和媒体相关行为已不依赖超大 `CallService`。

### Phase 3：实现 Coordinator 和单呼

- [ ] 新增 `CallCoordinator`。
- [ ] 迁移单呼创建、来电、响铃、接听、拒绝、取消和终止。
- [ ] 接入 `onParticipantsChanged`。
- [ ] 接入 `onHandledOnOtherDevice`。
- [ ] 接入 `onCallEnded`。
- [ ] 使用 callId 获取 RTC token 并作为频道名。
- [ ] 实现单一、幂等的结束清理入口。
- [ ] 从 Chat 单呼入口移除消息插入和 `inviteMessageId` 更新。

完成标准：两个浏览器账号可完成在线、离线、一端拒绝、主叫取消、接通挂断和多端处理。

### Phase 4：迁移群呼

- [ ] 使用 `createCall(kind: 'conference')` 发起群呼。
- [ ] 使用 `joinCall()` 接听群呼。
- [ ] 使用 `leaveCall()` 退出群呼。
- [ ] 使用 `inviteParticipants()` 继续邀请成员。
- [ ] 用快照 revision 和完整 participant list 更新成员 UI。
- [ ] 删除取消单个群成员邀请的按钮、回调和状态。
- [ ] 将邀请超时映射到 `timeoutSeconds`。
- [ ] 处理群呼最后成员离开和 `lastLeft` 结束原因。

完成标准：至少三账号完成发起、加入、拒绝、超时、追加邀请和依次退出。

### Phase 5：删除旧信令和通话记录耦合

- [x] 删除 CallKit 的普通聊天消息信令创建与发送。
- [x] 删除 CallKit `chatManager.onMessage` 信令监听。
- [ ] 删除 `alert`、`confirmRing`、`confirmCallee` 等旧 action。
- [ ] 删除手工 caller/callee device ID 协议。
- [ ] 删除 `sendCancelMessage()`、`sendHangupMessage()` 等旧实现。
- [x] 删除随机 callId/channel 生成。
- [x] 删除 `inviteMessageId`。
- [x] 删除 Chat 页面插入邀请消息和结束后修改邀请消息的逻辑。
- [ ] 删除仅服务于旧信令的类型、常量、定时器和日志。
- [ ] 删除或彻底重写原 `CallService`，不得保留双协议死代码。

完成标准：仓库中不再存在 `rtcCall` 消息 action；呼叫不会改变消息列表、会话未读数。

### Phase 6：公共 API、文档和 demo

- [ ] 更新 CallKit ref 类型和所有调用方。
- [ ] 更新 CallKit demo，不再处理返回的 `ChatSDK.Message`。
- [ ] 更新单呼/群呼接入文档。
- [ ] 明确标注本版本为破坏性升级。
- [ ] 文档说明不生成通话记录、不支持单成员取消邀请。
- [ ] 文档说明 SDK/服务端最低版本。

完成标准：示例代码与新 API 一致，项目内无旧返回类型引用。

## 10. 预计文件影响

| 文件/目录 | 主要改动 |
| --- | --- |
| `module/SDK.ts` | 注册并导出 `CallSignalingManager` |
| `module/store/index.ts` | 挂载 `CallStore` |
| `module/store/Provider.tsx` | 登录前安装事件桥，卸载时清理 |
| `module/callkit/CallKit.tsx` | 改为观察 Store 并调用 Coordinator |
| `module/callkit/services/CallService.ts` | 拆分后删除或缩减为临时迁移壳 |
| `module/callkit/types/index.ts` | 新快照模型和破坏性 ref API |
| `module/chat/Chat.tsx` | 删除邀请消息插入、通话记录更新 |
| `module/callkit/signaling/` | 新增原生信令适配 |
| `module/callkit/rtc/` | 新增 RTC 和媒体服务 |
| `module/callkit/audio/` | 新增铃声服务 |
| `module/callkit/controller/` | 新增流程编排 |
| `module/callkit/store/` | 新增 CallKit 状态源 |
| `demo/callkit/` | 更新示例与联调入口 |

## 11. 测试计划

### 11.1 单元测试

- `CallStore`
  - revision 新旧判断；
  - participant 完整列表替换；
  - 非当前 callId 事件忽略；
  - reset 幂等。
- `CallSignalingService`
  - 命令到 SDK API 的映射；
  - ext 序列化与 2KB 校验；
  - handler 注册和移除；
  - SDKError 到 CallKit 错误的转换。
- `participantDiff`
  - pending → ringing → accepted；
  - rejected/busy/timeout/canceled；
  - accepted → left/hanguped。
- `CallCoordinator`
  - 单呼和群呼的命令选择；
  - 重复点击接听/挂断防抖；
  - 信令结束和 RTC 结束同时到达时只清理一次。
- RTC/Media/Audio service
  - join/leave；
  - track 创建和销毁；
  - 重复 dispose；
  - 铃声切换和停止。

### 11.2 组件测试

- CallKit 挂载前 Store 已有邀请时显示来电 UI。
- 其他设备处理后关闭来电 UI。
- participant snapshot 驱动群成员状态。
- 不再向 MessageStore 写入邀请或结束记录。
- 不再展示取消单个群成员邀请操作。

### 11.3 真实环境联调

- 在线单呼：语音、视频。
- 被叫离线，登录后收到邀请。
- 主叫在被叫接听前取消。
- 被叫拒绝、忙线、超时。
- 接通后任一方挂断。
- 同一账号多设备接听/拒绝。
- Fusion WebSocket 断线重连后的快照同步。
- 三人以上群呼、追加邀请、成员拒绝、超时和退出。
- SDK 信令事件发生时消息列表和未读数保持不变。
- logout、重复登录和 Provider 卸载无残留铃声、轨道或监听器。

## 12. 验收门禁

实现完成必须满足：

1. `npm run typecheck:lib`
2. CallKit 相关 Vitest 全部通过。
3. `npm run validate:lib`
4. `npm run build`
5. 完成第 11.3 节真实环境联调并保存关键日志。
6. 搜索确认不存在旧信令发送和解析入口：

   ```bash
   rg "rtcCall|confirmRing|confirmCallee|sendCallMessage|inviteMessageId" module/callkit module/chat
   ```

   仅允许迁移说明或无业务含义的历史文本命中。

## 13. 主要风险与控制

### 离线邀请丢失

风险：CallKit 挂载晚于 Manager 离线拉取。  
控制：Provider 登录前注册事件，邀请先进入全局 CallStore。

### 信令状态和 RTC 状态相互覆盖

风险：RTC `user-left` 被错误解释为整场结束。  
控制：状态分层；结束只认 SDK 信令事件和命令结果。

### 重复挂断和重复清理

风险：用户点击、RTC 回调和 `onCallEnded` 同时触发。  
控制：Coordinator 使用 operation guard，`cleanupCall()` 幂等且不发送信令。

### 快照乱序

风险：较旧 participant 事件覆盖新状态。  
控制：按十进制字符串安全比较 uint64 revision，拒绝旧 revision。

### 群呼 API 契约误用

风险：群呼被叫错误调用 `acceptCall()`。  
控制：实现前用目标 SDK 和真实服务端确认 `joinCall()`，并固化契约测试。

### CallService 一次性拆分回归

风险：迁移信令同时改动 RTC 导致问题难定位。  
控制：先做保持行为的 RTC/Media/Audio 提取，再切换信令；每个 Phase 独立可验证。

## 14. 完成定义

满足以下条件后，本迁移才算完成：

- 所有 CallKit 信令均由 `CallSignalingManager` 完成。
- 普通 IM 消息不再承载 CallKit 信令。
- 离线邀请、多设备、忙线和超时由服务端权威状态驱动。
- 单呼、群呼和继续邀请流程通过真实环境验证。
- CallService 已拆分，协议、RTC、媒体、音频和状态各自有清晰边界。
- CallKit 不生成呼叫记录消息。
- 不存在取消单个群成员邀请的 API 或 UI。
- 新公共 API、demo 和文档一致，旧调用方式在类型检查阶段明确失败。
