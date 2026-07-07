## Why

The UIKit now has clearer foundation and SDK adapter boundaries, but those read-path contracts are still protected mostly by type checking and a small set of UI smoke tests. The next adapter or store refactor can easily regress normalization behavior, preview derivation, or conversation sync rules without a focused test layer catching it.

## What Changes

- Add a first wave of contract tests for UIKit adapter helpers and sync logic.
- Cover normalized conversation, thread, and message preview helpers with focused Vitest cases.
- Cover `ConversationSyncService` behavior for unread count updates, conversation creation, and `@mention` state handling with lightweight store/client fakes.
- Extend the contract layer into pinned-message store behavior and pinned SDK event handling with lightweight boundary tests.
- Keep the scope intentionally narrow to the most reused adapter and sync surfaces rather than trying to build the full long-term test pyramid in one pass.

## Capabilities

### New Capabilities
- `uikit-adapter-contract-tests`: Defines a stable contract-test layer for normalized adapter helpers and high-value sync behavior that future UIKit refactors must preserve.

### Modified Capabilities
- None.

## Impact

- Affected code includes `module/utils/`, `module/store/ConversationSyncService.ts`, `module/store/PinnedMessagesStore.ts`, `module/hooks/chat.ts`, and new colocated Vitest test files.
- This change should improve regression detection for the recently added adapter layer without changing public runtime behavior.
- No new runtime dependency is required; the work should stay within the current Vitest + happy-dom toolchain.
