## Why

SDK 5 主迁移已完成并归档，但用户文档仍偏 API/局部说明，缺少「如何成功接入」的完整路径。当前最缺的是三种接入模式、SDK5 用户向迁移指南、业务数据接入说明，以及场景化 FAQ；这些直接决定开发者和 AI coding agent 能否正确使用 UIKit，而不必深挖 `rootStore` 内部实现。

## What Changes

- 新增/重写面向接入的文档体系：三种接入模式、SDK5 迁移指南、业务数据接入、场景 FAQ。
- 补齐可复制的最小示例（完整页面、hooks 组合、纯 UI），并与现有 `foundation-quickstart`、`provider`、`userInfo` 对齐。
- 更新 `llms.txt` / 文档索引，使 AI 与人工都能从同一入口找到推荐路径。
- 不在本 change 中做页面 slot 化、headless hooks 大重构，或 Public Store API 收紧（后者单独开 `uikit-public-store-api`）。

## Capabilities

### New Capabilities
- `uikit-integration-docs`: 定义 UIKit 推荐接入路径文档合同，包括三种接入模式、SDK5 迁移指南、业务数据接入与场景 FAQ，以及对应的文档索引/示例要求。

### Modified Capabilities
- `sdk5-docs-demos`: 补充用户向 SDK5 迁移文档与示例入口要求，使其从「内部迁移笔记」升级为对外可用的接入指南。

## Impact

- 主要影响 `docs/zh/`、`docs/en/`（如有对等英文）、`llms.txt`、`README.md` 文档入口，以及少量可复制 demo/example 片段。
- 可能轻微调整 `AGENTS.md` 中「常见任务怎么改 / 推荐接入路径」指引，使其与新文档一致。
- 不改变运行时公共 API 行为；不引入 **BREAKING** 代码变更。
- 为后续 `uikit-public-store-api` 提供文档锚点（哪些 Store API 应被文档化/哪些应标 internal）。
