## Context

SDK 5 升级已归档。现有文档有 `foundation-quickstart`、`provider`、`userInfo`、局部模块文档和 `troubleshooting`，但缺少统一的「接入路径」叙事：开发者不知道该选完整页面、hooks 组合还是纯 UI；SDK5 迁移说明仍偏内部笔记；业务数据接入（自定义消息、上传、权限）分散；FAQ 未覆盖高频场景（头像不一致、联系人为空、同步失败、未读重登回来等）。

本 change 在文档层补齐这些路径，为后续 `uikit-public-store-api` 提供「哪些能力应对外说明」的锚点。

## Goals / Non-Goals

**Goals:**
- 建立三种接入模式文档，并给出每种模式的最小可运行示例。
- 提供用户向 SDK5 迁移指南（字段、登录、事件、未读/已读回执）。
- 提供业务数据接入指南（userInfo/groupInfo、自定义消息、上传、权限/审核相关扩展点现状）。
- 扩展场景 FAQ，并更新 `llms.txt` / README 入口索引。
- 保持与现有 `Provider` / `providers.*` 推荐合同一致。

**Non-Goals:**
- 不做 Chat/ConversationList slot API 或 headless hooks 大重构。
- 不收紧 Store 导出面（留给 `uikit-public-store-api`）。
- 不实现 fileUploadProvider 运行时能力（文档可说明现状/缺口）。
- 不要求本 change 新增 Playwright E2E。

## Decisions

### 1. 以「接入路径」组织文档，而不是继续堆 API 表

按用户目标组织：
1. 完整页面模式（Provider + ConversationList + Chat）
2. 组合 hooks / store context 模式
3. 纯 UI 组件模式

每条路径包含：适用场景、最小示例、下一步定制入口、不应做的事（例如直接依赖内部路径）。

Alternative considered: 只扩写现有 quick_start。Rejected，因为三种用户画像需要不同入口，单页 quick start 会继续混杂。

### 2. SDK5 迁移指南独立成用户向文档

将 `openspec/.../migration-notes.md` 中对外有用的内容提炼到 `docs/zh/sdk5-migration.md`（及必要时英文），覆盖：
- token 登录、密码登录不再支持
- Message / Conversation 字段对照
- `sendStatus` / `isPeerRead` / `groupReadCount`
- 未读清零与已读回执 API（`clearConversationUnreadMessageCount` / `sendMessageReadReceipts`）
- 事件名变更（如 `onMessageReadReceipts`）

Alternative considered: 只在 README 加一小段。Rejected，迁移问题足够多，需要独立可检索文档。

### 3. FAQ 优先覆盖真实接入失败场景

优先写入：
- 会话有头像但消息 sender 没有
- 联系人为空 / enableSyncData
- 同步失败 / onSyncDataFinished
- 未读点击后消失但重登又回来
- 本地 import 内部路径导致升级破碎

FAQ 放在 `docs/zh/faq.md` 或扩展现有 `troubleshooting.md`；本设计选择新增 `docs/zh/faq.md` 做场景问答，troubleshooting 继续放构建/运行时错误。

### 4. 中文优先，英文按存量入口补齐

本仓库中文文档更完整。第一波以 `docs/zh/` 为主，英文仅补齐与现有 `docs/en/` 入口对等的关键页（quick start / migration / FAQ 索引），避免本 change 变成全量双语翻译工程。

### 5. AI 友好索引同步更新

更新 `llms.txt` 指向新文档；必要时在 `AGENTS.md` 增加「推荐接入路径」短链。不新增完整 `llms-full.txt`（可作为 follow-up）。

## Risks / Trade-offs

- [文档与代码漂移] → Mitigation: 示例只使用已导出的公共 API；任务中包含与 `foundation-quickstart` / `provider` / `userInfo` 的交叉校验。
- [范围膨胀到实现 Store API] → Mitigation: Non-goals 明确排除；任务中只允许「文档标注现状与后续 change」。
- [英文文档滞后] → Mitigation: 明确中文优先；英文只补入口页。
- [上传/权限能力尚未成为 Provider 合同] → Mitigation: 文档写清「当前支持什么 / 缺口是什么 / 后续 change」。

## Migration Plan

1. 新增文档文件并更新现有索引页。
2. 更新 `llms.txt` / README 链接。
3. 本地用 `npm run docs:dev` 或静态检查链接可达。
4. 无运行时发布回滚压力；文档变更可独立 revert。

## Open Questions

- 英文迁移指南是否必须与中文同批完整发布，还是先中文、英文只做 stub？
- 自定义消息示例是否放 `docs/` 还是同时落到 `demo/` 可运行页？（倾向 docs 内嵌代码 + 可选 demo 链接）
