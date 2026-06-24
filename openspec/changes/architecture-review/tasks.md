## 1. Review Setup

- [x] 1.1 Read `AGENTS.md`, `SDK5_UPGRADE_PLAN.md`, and `openspec/changes/sdk5-upgrade/*`.
- [x] 1.2 Create a review output document under `openspec/changes/architecture-review/review.md`.
- [x] 1.3 Define the finding template with file evidence, issue, impact, recommendation, and timing classification.

## 2. Runtime And Store Review

- [x] 2.1 Review Provider, RootContext, RootStore, and SDK client lifecycle.
- [x] 2.2 Review MessageStore ownership, message indexing, and send/receive responsibilities.
- [x] 2.3 Review ConversationStore ownership, unread/read semantics, search, pin, and silent mode responsibilities.
- [x] 2.4 Review AddressStore ownership of contacts, users, groups, presence, blocklist, and chatroom data.
- [x] 2.5 Review ThreadStore and PinnedMessagesStore boundaries.

## 3. Component And Feature Review

- [x] 3.1 Review message renderer components and their coupling to SDK message fields.
- [x] 3.2 Review message input modules and send flow responsibilities.
- [x] 3.3 Review Chat, ConversationList, ContactList, Chatroom, and Thread container boundaries.
- [x] 3.4 Review CallKit IM signaling and Agora RTC separation.
- [x] 3.5 Review public exports and type naming consistency.

## 4. Validation Surface Review

- [x] 4.1 Review demos and stories as SDK 5 validation surfaces.
- [x] 4.2 Review existing tests and identify gaps relevant to SDK 5 migration.
- [x] 4.3 Review docs and migration guidance gaps.

## 5. Classification And Follow-up

- [x] 5.1 Classify each finding as `Blocker for SDK5`, `Do after SDK5`, or `Nice to have`.
- [x] 5.2 Add SDK 5 blockers to the relevant `sdk5-upgrade` design/spec/task locations.
- [x] 5.3 List future OpenSpec change candidates for non-blocking architecture work.
- [x] 5.4 Run `openspec validate architecture-review --strict`.
