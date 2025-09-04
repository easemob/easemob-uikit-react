## v2.0.0 2025.9.4

- 增加 CallKit 组件
- Chat 组件
  1. 移除原 chat-callkit 组件，使用新的 CallKit 组件，同时移除 rtcConfig 参数。
  2. 增加 useCallkit 参数，代表是否使用 Callkit, 默认为 true。
  3. 增加 callkitProps 参数，为 Callkit 参数。
- useSDK 不再返回 AgoraRTC,
