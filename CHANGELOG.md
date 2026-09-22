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
