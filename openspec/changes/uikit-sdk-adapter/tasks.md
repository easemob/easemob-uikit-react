## 1. Adapter Setup

- [x] 1.1 Add dedicated normalized helper modules for conversation and thread reads under `module/utils/`.
- [x] 1.2 Keep the existing message helpers as the shared message adapter surface and align naming with the new adapter modules.

## 2. Initial Migration

- [x] 2.1 Migrate `ConversationItem` to adapter helpers for title, preview, timestamp, sender, and thread-related reads where appropriate.
- [x] 2.2 Migrate selected store/util paths such as conversation and thread state handling to use adapter helpers instead of ad hoc field probing.

## 3. Validation

- [x] 3.1 Run `npm run validate:lib`.
- [x] 3.2 Run `npm run validate:foundation`.
- [x] 3.3 Update task progress and capture remaining adapter migration follow-ups for later commits.

## Follow-ups

- [x] Migrate remaining conversation list and sync paths such as `ConversationList`, `ConversationSyncService`, and related search/filter helpers onto adapter reads where they still probe raw fields directly.
- [x] Expand thread adapter adoption into thread UI modules and pinned/replied message surfaces that still compare `id`, `chatThreadId`, or overview payloads inline.
- [x] Decide whether conversation preview rendering should move into a dedicated adapter/presenter helper once more message surfaces converge on the same snippet rules.

## Remaining Scope

- [x] Unify conversation preview/snippet derivation behind a dedicated helper if more message surfaces need the same rendering rules.
- [x] Continue thread adapter adoption in pinned/replied/thread-adjacent modules that still read raw thread overview payloads opportunistically rather than through helpers.
