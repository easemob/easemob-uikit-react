# CallKit 真实环境端到端测试

这些用例启动 `demo/callkit/call-demo.html`。无需账号的用例先检查 Chromium 虚拟摄像头和麦克风能否取流；提供两个真实 IM 账号后，其他用例会通过真实呼叫信令与 Agora RTC 建立通话。音频用例会确认服务端通话已结束，然后才运行共用账号的视频用例；视频用例覆盖 B 断网挂断、恢复网络、A 再次邀请、B 接听的流程。

准备两个可登录同一应用的账号，以及可访问的 REST、MSync、Fusion 和 Agora 服务。默认在独立的 5175 端口启动全新的本地 `dev:demo`，避免复用手工运行的 5174 服务及其过期的 Vite 依赖缓存；服务使用 `vite.demo.config.ts` 中的代理目标。可以通过 `EASEMOB_DEMO_REST_PROXY_TARGET`、`EASEMOB_DEMO_MSYNC_PROXY_TARGET`、`EASEMOB_DEMO_FUSION_PROXY_TARGET` 指向联调服务。

```bash
npx playwright install chromium
export EASEMOB_APPKEY='org#app'
export EASEMOB_USERID='caller'
export EASEMOB_TOKEN='caller-token'
export EASEMOB_SECOND_USERID='callee'
export EASEMOB_SECOND_TOKEN='callee-token'
npm run test:e2e:callkit
```

也可以用 `EASEMOB_PASSWORD`、`EASEMOB_SECOND_PASSWORD` 代替 Token。若已在另一个终端启动 demo，可设置 `E2E_BASE_URL=http://127.0.0.1:5174`，测试不会再启动服务器。SDK 重新构建后，请重启手动启动的 demo 服务，使 Vite 加载新的 `dist`。未提供双账号凭证时，仅真实通话用例会跳过。

虚拟设备验证浏览器取流、轨道发布、远端视频显示及重入流程；它不能证明真实摄像头、麦克风和扬声器在不同设备上的画质、音质或兼容性。测试仅运行 Chromium，其他浏览器和真机仍需单独验证。

真实呼叫用例失败时，`test-results/` 会保存 A、B 两端的 `caller-call-state.json`、`callee-call-state.json` 和页面截图。状态文件记录通话 ID、成员和设备状态、信令连接状态及相关日志，不包含登录 Token。音频邀请未显示时，还会保存 `callee-offline-probe.json`，用于判断离线队列是否能补出邀请；`caller-cleanup.json` 记录失败后取消未建立通话的结果。

## 呼叫信令 API 用例

`npm run test:e2e:call-signaling` 运行 [call-signaling.spec.ts](./call-signaling.spec.ts) 中的 29 个测试。它复用上面的 A、B 账号配置，通过真实 IM 和 Fusion 服务验证 SDK 呼叫信令，不启动 Agora RTC，也不挂载 CallKit。C、D 账号用于三人会议、追加邀请和非参与者操作：

`npm run test:e2e:all` 会顺序运行本目录全部 33 个测试（CallKit 4 个，加信令 29 个）。

```bash
export EASEMOB_THIRD_USERID='third'
export EASEMOB_THIRD_TOKEN='third-token'
export EASEMOB_FOURTH_USERID='fourth'
export EASEMOB_FOURTH_TOKEN='fourth-token'
npm run test:e2e:call-signaling
```

也可用 `EASEMOB_THIRD_PASSWORD`、`EASEMOB_FOURTH_PASSWORD` 代替 Token。B 的双设备场景用两个独立浏览器上下文登录同一账号。缺少 C 或 D 时，只跳过对应的用例。由于所有用例共用账号，保持单 worker 运行；测试结束会结束仍在进行中的呼叫并关闭浏览器上下文。

[覆盖清单](./call-signaling-coverage.md) 将原设计文档的 56 项与现有 Web 自动化逐项对应。移动端系统通知场景需要 Android/iOS 真机与推送证书，不能由浏览器验证。
