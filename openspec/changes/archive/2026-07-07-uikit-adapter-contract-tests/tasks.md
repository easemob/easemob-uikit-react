## 1. Adapter Contract Tests

- [x] 1.1 Add focused Vitest coverage for normalized message helper behavior, including preview derivation and fallback order.
- [x] 1.2 Add focused Vitest coverage for normalized conversation and thread helper behavior.

## 2. Sync Contract Tests

- [x] 2.1 Add focused tests for `ConversationSyncService` conversation creation and unread update behavior.
- [x] 2.2 Add focused tests for `ConversationSyncService` `@mention` handling and skip conditions.

## 3. Validation

- [x] 3.1 Run `npm run validate:lib`.
- [x] 3.2 Run `npm run validate:foundation`.
- [x] 3.3 Update task progress and capture the next test-layer follow-ups.

## Follow-ups

- [x] Add a dedicated validation entry such as `validate:adapter` once the contract-test surface expands beyond this first wave.
- [x] Extend contract coverage into pinned/replied message behavior and broader SDK event handling boundaries.
