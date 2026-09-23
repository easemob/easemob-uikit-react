## v2.0.4 2026.9.23

- 修复被叫收到原生呼叫邀请后只显示通知、CallKit 通话页面没有自动弹出的问题。
- 修复通话状态切换导致 CallService 重复销毁重建、后续呼叫可能丢失邀请订阅的问题。

## v2.0.3 2026.9.22

- CallKit demo 支持配置 AppKey，并可选择本地代理或自定义私有 REST、MSync 服务地址。
- 增加与 websdk2 demo 一致的 REST、MSync、Fusion WebSocket 开发代理，并支持通过环境变量覆盖代理目标。
- 修复浏览器没有可用摄像头时视频呼叫输出错误且预览状态不正确的问题；此时呼叫会以摄像头关闭状态继续。
- 修复 CallKit demo 的生产构建压缩配置。

## v2.0.2 2026.9.22

- CallKit demo 支持直接使用 Token 登录，或参考 Web SDK demo 先用密码换取 Token 再登录。
- 修正 CallKit demo 构建入口，并将构建目标调整为支持呼叫信令所需的 BigInt。

## v2.0.1 2026.9.22

- 将 Agora RTC 客户端生命周期、频道操作、本地媒体轨道和远端音频控制从 `CallService` 拆分为独立服务。
- 完善群呼参与者快照 diff，覆盖等待、接通、拒绝/忙线/超时、主动离开、快照成员消失及资料字段变化，并驱动 UI 窗口增量更新。
- 为 RTC、媒体、音频和参与者 diff 补充针对性单元测试。

## v2.0.0 2026.9.22

- CallKit 改用 SDK 原生 `CallSignalingManager`，移除基于普通 IM 消息的呼叫信令。
- 支持 Fusion 在线/离线邀请、服务端参与者状态和多端处理事件。
- 呼叫 API 改为返回 `CallSnapshot`，不再生成或更新聊天中的呼叫记录消息。
- 移除单个群成员邀请取消能力。
- 拆分 CallKit 信令适配、CallStore 和铃声服务，降低 `CallService` 职责耦合。

## v2.0.0 2025.9.4

- 增加 CallKit 组件
- Chat 组件
  1. 移除原 chat-callkit 组件，使用新的 CallKit 组件，同时移除 rtcConfig 参数。
  2. 增加 useCallkit 参数，代表是否使用 Callkit, 默认为 true。
  3. 增加 callkitProps 参数，为 Callkit 参数。
- useSDK 不再返回 AgoraRTC,
