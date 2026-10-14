# 呼叫信令用例覆盖

原始设计：`call-signaling-test-cases.md`（2026-09-24）。Web SDK 使用小写字符串枚举；成功返回 `Promise<CallSnapshot>`，失败拒绝并携带 `error.code`。本目录的真实环境测试据此断言。

原始清单的 56 是需求编号数；29 是 Playwright 测试函数数，不能直接相减。一个测试会串起多个编号，例如 A-03/A-04、D-01/D-03/D-04。29 个 Playwright 测试涉及 45 个 Web 编号；E-06 另由 Web SDK 单元测试覆盖。A-05 的接口定义不符、E-07 的参与者变更去重断言尚未完整覆盖；E-10 ～ E-17 是移动端专属。

| 设计用例 | 自动化位置 | 说明 |
| --- | --- | --- |
| A-01 ～ A-04、A-06 | `call-signaling.spec.ts` | 语音／视频、被叫结束、跳过振铃、透传字段 |
| A-05 | F-11 覆盖现有 API | 设计要求同步读本地快照；当前 `getCallSnapshot` 是异步服务端同步，接口语义不同，不能按原断言实现 |
| B-01 ～ B-07 | `call-signaling.spec.ts` | B-06 重复 `terminateCall` 当前服务端返回 1707：成员已是 HANGUPED，不符合再次结束的状态条件；原设计写的 1706 与此不一致。B-07 兼容直接返回忙线和被叫收到第二通来电后拒绝两种表现 |
| C-01 ～ C-06 | `call-signaling.spec.ts` | B 的两个浏览器上下文模拟两台设备。C-03/C-04 验证 B2 收到 `onHandledOnOtherDevice(REJECTED/BUSY)`，主叫与 B2 收到对应原因的 `onCallEnded`；B1 的 `rejectCall` 返回已结束的快照 |
| D-01 ～ D-09 | `call-signaling.spec.ts` | 三／四账号会议、拓扑校验、无缓存操作；D-09 只断言错误来自服务端，不锁定待确认的具体业务码 |
| E-01 ～ E-05、E-08 ～ E-09 | `call-signaling.spec.ts` | 离线登录、超时／取消、断网重连、登出清理 |
| E-06 | `websdk2/tests/unit/call-signaling/resume-eligibility.test.ts` | 注入设备被替换后的权威快照，验证本地清理和单次 `unspecified` 结束事件 |
| E-07 | `websdk2/tests/integration/call-signaling/fetch-offline.integration.test.ts` | 目前只覆盖同一 `msg_id` 的邀请去重；参与者变更回调去重仍需消息注入测试 |
| E-10 ～ E-17 | Android／iOS 设备测试 | 系统通知栏、推送证书和点击冷启动不属于浏览器能力；本仓库不实现虚假的浏览器断言 |
| F-01 ～ F-11 | `call-signaling.spec.ts` | F-08 覆盖 0、负数、1、`uint32` 上界及溢出；F-11 对应 Web `getCallSnapshot` |

真实环境测试需要可用的 REST、MSync、Fusion 服务和账号。它们不是无账号的 CI 单元测试；未提供账号时 Playwright 会报告跳过。上表记录已确认的服务端行为与原设计差异，其余待确认项应在联调后继续回填。
