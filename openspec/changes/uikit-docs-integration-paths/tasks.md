## 1. Doc Inventory And Outline

- [x] 1.1 Audit existing docs (`docs/zh/foundation-quickstart.md`, `provider.md`, `userInfo.md`, `quick_start.md`, `troubleshooting.md`, `store.md`, README, `llms.txt`) and list content to reuse vs rewrite.
- [x] 1.2 Finalize the Chinese doc file map: integration modes, SDK5 migration, business data, FAQ, and index updates.
- [x] 1.3 Decide English coverage for this wave (full pages vs stub/index links) and record it in the PR/notes.

## 2. Three Integration Modes

- [x] 2.1 Add `docs/zh/integration-modes.md` describing full-page, hooks/store composition, and pure UI modes with when-to-use guidance.
- [x] 2.2 Add a copyable full-page minimal example aligned with `Provider.providers` and public package imports.
- [x] 2.3 Add a hooks/store composition example that only uses exported surfaces (no internal `module/store/*` imports).
- [x] 2.4 Add a pure UI example and explicitly document current headless/slot limits and the follow-up `uikit-public-store-api` / headless changes.

## 3. SDK 5 User Migration Guide

- [x] 3.1 Add `docs/zh/sdk5-migration.md` covering token login, removed password login, message/conversation field mapping, and manager APIs.
- [x] 3.2 Document unread clear and read-receipt migration: `clearConversationUnreadMessageCount`, `sendMessageReadReceipts`, `onMessageReadReceipts`, `sendStatus`, `isPeerRead`, `groupReadCount`.
- [x] 3.3 Link the migration guide from README and `foundation-quickstart.md`.

## 4. Business Data And FAQ

- [x] 4.1 Add or expand business-data docs for `providers.userInfo`, `providers.groupInfo`, custom message send/render, and current upload/permission support gaps.
- [x] 4.2 Add `docs/zh/faq.md` covering avatar inconsistency, empty contacts/sync failure, unread returning after re-login, and internal-path import pitfalls.
- [x] 4.3 Cross-link FAQ entries from `troubleshooting.md` where runtime errors overlap.

## 5. Indexes And AI Guidance

- [x] 5.1 Update `llms.txt` to index the new integration-mode, migration, business-data, and FAQ docs.
- [x] 5.2 Update README / docs index navigation so the recommended path is discoverable in one step.
- [x] 5.3 Update `AGENTS.md` with a short “recommended integration path” pointer aligned to the new docs.

## 6. Validation

- [x] 6.1 Cross-check all new examples against exported package APIs and SDK 5 field names.
- [x] 6.2 Run `openspec validate uikit-docs-integration-paths --strict`.
- [x] 6.3 Capture follow-up: `uikit-public-store-api` for documented Store public/internal boundary and provider tightening.
