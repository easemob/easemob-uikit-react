## Why

The UIKit currently depends on the legacy `easemob-websdk@4.x` connection API and message shape throughout stores, hooks, modules, demos, and CallKit. SDK 5.0 introduces `ChatClient`, manager-based APIs, direct Promise return values, a new event system, and a new native message/conversation data model, so the library must migrate now before new SDK capabilities can be safely adopted.

## What Changes

- **BREAKING** Replace legacy `new SDK.connection(...)`, `conn.open(...)`, `conn.send(...)`, and `chatSDK.message.create(...)` usage with SDK 5.0 `ChatClient` plus managers.
- **BREAKING** Migrate internal message, conversation, user, group, chatroom, thread, pinned-message, reaction, and CallKit flows to SDK 5.0 native types and fields.
- **BREAKING** Remove password login support from UIKit initialization because SDK 5.0 no longer supports `pwd` login.
- **BREAKING** Replace legacy public callback payloads that expose old SDK message shapes with SDK 5.0-native message and operation payloads where applicable.
- Update Provider, RootStore, RootContext, hooks, stores, message modules, container components, CallKit, demos, stories, and docs to use SDK 5.0 semantics.
- Add validation and cleanup checks to prevent legacy API and legacy message-field usage from remaining as internal primary paths.

## Capabilities

### New Capabilities

- `sdk5-runtime`: SDK 5.0 initialization, manager registration, login, current-user access, and root runtime wiring.
- `sdk5-messaging`: SDK 5.0 native message creation, sending, receiving, message rendering, message store indexing, history, acknowledgements, and message operations.
- `sdk5-conversations`: SDK 5.0 native conversation list, current conversation, unread, deletion, read state, pinning, and silent mode behavior.
- `sdk5-address-book`: SDK 5.0 native contacts, user profile, blocklist, presence, groups, group members, and group events.
- `sdk5-chatroom-thread`: SDK 5.0 native chatroom, chatroom members, chat threads, pinned messages, reactions, translation, recall, and modify flows.
- `sdk5-callkit`: CallKit integration using SDK 5.0 message creation, send APIs, RTC token APIs, and native payload shapes.
- `sdk5-docs-demos`: Documentation, demos, stories, migration notes, and agent guidance updated for SDK 5.0.

### Modified Capabilities

- None. This repository has no existing OpenSpec specs yet.

## Impact

- Dependencies: `easemob-websdk` upgrades from 4.x legacy connection API to SDK 5.0 `ChatClient` and managers.
- Runtime: `Provider`, `RootStore`, `RootContext`, SDK event registration, login, and manager usage are rewritten.
- Data model: internal stores and UI modules migrate from legacy fields such as `msg`, `mid`, `id`, `chatType`, `customEvent`, and `customExts` to SDK 5.0 fields such as `body`, `msgServerId`, `msgLocalId`, `conversationType`, `conversationId`, and `sender`.
- User-facing APIs: advanced callbacks and exported types may change to SDK 5.0-native payloads.
- Verification: build, tests, demos, Storybook mocks, and manual IM flows must be updated and revalidated.
