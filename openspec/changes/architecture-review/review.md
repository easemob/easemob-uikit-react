# Architecture Review

This review identifies design and implementation issues discovered before the SDK 5.0 migration. Findings are classified by timing:

- `Blocker for SDK5`: must be handled inside `sdk5-upgrade`.
- `Do after SDK5`: useful architecture work after SDK 5.0 reaches a stable baseline.
- `Nice to have`: optional cleanup or polish.

## Finding Template

Each finding uses this shape:

- **Timing**:
- **Area**:
- **Evidence**:
- **Issue**:
- **Impact**:
- **Recommendation**:
- **SDK5 Follow-up**:

## Blocker For SDK5

### 1. Provider and root runtime perform SDK lifecycle work in render paths

- **Timing**: `Blocker for SDK5`
- **Area**: Runtime / Provider lifecycle
- **Evidence**: `module/store/Provider.tsx` creates the SDK client with `new chatSDK.connection(initOptions)`, calls `rootStore.setClient(client)` and `rootStore.setInitConfig(initConfig)` in the component body, calls `useEventHandler(props)` after mutating the singleton store, initializes i18n in the component body, and supports both token and password `client.open(...)`.
- **Issue**: The runtime boundary mixes render-time side effects, global singleton mutation, SDK construction, login, i18n initialization, theme color generation, event registration, and feature config. SDK 5.0 initialization and manager registration need a clearer lifecycle because `ChatClient.init` is singleton-like and rejects conflicting config.
- **Impact**: During SDK 5 migration, repeated renders or appKey changes can cause duplicate event handlers, stale rootStore client references, repeated i18n initialization, or `ChatClient already initialized with different config` errors.
- **Recommendation**: In `sdk5-upgrade`, make Provider the only owner of `ChatClient.init`, manager registration, login/logout, and context value creation. Move rootStore mutations into effects or memoized initialization with explicit dependencies. Initialize i18n and theme side effects through controlled effects.
- **SDK5 Follow-up**: Add to `sdk5-upgrade` runtime tasks before event migration. This is required for `sdk5-runtime`.

### 2. SDK operations are scattered through stores and UI modules

- **Timing**: `Blocker for SDK5`
- **Area**: SDK call ownership / stores / components
- **Evidence**: `MessageStore.sendMessage` calls `rootStore.client.send`; `ConversationStore` calls `getGroupInfo`, `pinConversation`, `getServerPinnedConversations`, silent-mode APIs; `AddressStore` calls contact, group, chatroom, blocklist, and presence SDK APIs; `ThreadStore` calls thread APIs; `Textarea` and `MoreAction` call `chatSDK.message.create`; `CallService` calls `WebIM.message.create` and `connection.send`.
- **Issue**: SDK API calls are not isolated by manager/domain boundary. The SDK 5 migration has to update call sites across stores, hooks, UI components, and CallKit all at once.
- **Impact**: Migration risk is high because return value changes, manager selection, error handling, and data model changes will be duplicated in many files.
- **Recommendation**: For `sdk5-upgrade`, define domain-level SDK access conventions: ChatManager calls live in message/conversation actions or hooks; ContactManager/UserInfoManager/PresenceManager calls live in address-book actions; GroupManager and ChatRoomManager calls live in their domain stores/hooks; UI input components construct send intents or call a message-send action instead of directly importing SDK factories.
- **SDK5 Follow-up**: Reflect in `sdk5-messaging`, `sdk5-conversations`, `sdk5-address-book`, `sdk5-chatroom-thread`, and `sdk5-callkit` tasks. Do not create a legacy compatibility facade.

### 3. Legacy message fields are the primary store indexes and UI contract

- **Timing**: `Blocker for SDK5`
- **Area**: Message model / stores / renderers
- **Evidence**: `MessageStore` indexes by `message.id`, writes `message.mid`, routes by `chatType/to`, updates by `item.id || item.mid`, and branches on legacy `type` values like `txt`, `img`, and `audio`. `TextMessage` reads `textMessage.chatType`, `msg`, `time`, `bySelf`, and deletes by `mid || id`. `PinnedMessagesStore` finds pinned messages with `msg.message.id === messageId || msg.message.mid === messageId`.
- **Issue**: The old model is embedded as the internal source of truth. SDK 5.0 uses `msgLocalId`, `msgServerId`, `conversationType`, `conversationId`, `body`, `timestamp`, and native message type names.
- **Impact**: Any partial migration that leaves old fields as primary paths will either break SDK 5 data or silently recreate a legacy compatibility layer, which the upgrade explicitly rejects.
- **Recommendation**: In `sdk5-upgrade`, migrate MessageStore first to a native SDK 5 message model with explicit local/server ID indexing. Then migrate renderers and operations to the new model.
- **SDK5 Follow-up**: Already covered by `sdk5-messaging`; keep this as a gating design constraint.

### 4. Public customization hooks expose mutable legacy message objects

- **Timing**: `Blocker for SDK5`
- **Area**: Public API / message input
- **Evidence**: `TextareaProps.onBeforeSendMessage?: (message: ChatSDK.MessageBody) => Promise<CurrentConversation | void>` receives a legacy message created by `chatSDK.message.create`. The callback can mutate `message.to` and `message.chatType`. `MoreActionProps.onBeforeSendMessage` follows the same pattern for attachments and custom card messages.
- **Issue**: The public extension point is coupled to old SDK message instances and old routing fields. SDK 5.0 send options and message factories have different parameters and immutable expectations around sender/current user.
- **Impact**: This is a breaking API surface. If not designed deliberately during SDK migration, consumers will get inconsistent behavior or be forced into old field names.
- **Recommendation**: In `sdk5-upgrade`, replace this with a SDK 5-native extension contract. Prefer a send draft shape or SDK 5 `Message` plus explicit return of `{ conversationId, conversationType, ext, sendOptions }`.
- **SDK5 Follow-up**: Add or refine `sdk5-messaging` requirements/tasks for `onBeforeSendMessage` migration and docs.

### 5. Event handling violates hook boundaries and depends on old aggregate events

- **Timing**: `Blocker for SDK5`
- **Area**: SDK events / hooks
- **Evidence**: `module/hooks/chat.ts` registers old typed message callbacks and old aggregate events such as `onGroupEvent`, `onGroupChange`, `onChatThreadChange`, and `onPresenceStatusChange`. It also calls `useGroupMembersAttributes(id, [message.from])` inside an event callback, even though that function is named as a hook and may itself access store context conventions.
- **Issue**: SDK 5.0 uses `onMessage` and manager-specific event callbacks. The current event layer also mixes event normalization, store mutation, user info fetching, presence mapping, and thread/pin notice construction in one hook.
- **Impact**: Event migration will be hard to validate and easy to duplicate. The hook-style call inside event callbacks is a correctness risk and should not be carried into the new event system.
- **Recommendation**: In `sdk5-upgrade`, split SDK event registration by manager/domain and route events into store actions or domain handlers. Ensure event handlers call plain functions/actions, not React hooks.
- **SDK5 Follow-up**: Add to event phase before message/component migration.

### 6. CallKit is tightly coupled to legacy IM message creation and connection internals

- **Timing**: `Blocker for SDK5`
- **Area**: CallKit / IM signaling
- **Evidence**: `module/callkit/services/CallService.ts` imports `WebIM from 'easemob-websdk'`, calls `WebIM.message.create`, `this.connection.send`, reads `this.connection.user`, and reads `this.connection.context.jid.clientResource` for call signaling.
- **Issue**: CallKit depends on old IM SDK factories and connection internals while also managing Agora RTC state in the same service.
- **Impact**: SDK 5.0 migration will break call invite, alert, answer, cancel, hangup, busy, and timeout signaling unless CallKit is migrated explicitly.
- **Recommendation**: Keep CallKit as its own `sdk5-upgrade` phase. Replace IM signaling with SDK 5 ChatManager message factories and send APIs. Replace legacy `connection.context.jid.clientResource` reads with SDK 5 `client.getClientResource()`.
- **SDK5 Follow-up**: Covered by `sdk5-callkit`; CallKit signaling should use `client.getClientResource()` for device/resource identifiers.

## Do After SDK5

### 7. Store boundaries mix domain data, remote commands, and cross-store UI effects

- **Timing**: `Do after SDK5`
- **Area**: MobX store architecture
- **Evidence**: `MessageStore.receiveMessage` updates messages, conversation list, address-store user info, unread state, thread filtering, and read acknowledgements. `ConversationStore.setCurrentCvs` mutates unread counts and calls `messageStore.sendChannelAck`. `AddressStore.modifyGroup` mutates group state, current conversation, message store current conversation, and conversation list.
- **Issue**: Stores are not clear domain owners. They directly call each other and perform remote operations plus UI state changes in the same methods.
- **Impact**: Bugs are harder to localize and tests require large rootStore setup. SDK 5 migration must touch these paths, but a full store redesign would expand scope too much.
- **Recommendation**: After SDK5, consider separating domain stores from service/action layers. For example, keep stores mostly stateful and put remote commands in domain services or action hooks.
- **SDK5 Follow-up**: Only fix the parts required by SDK 5 native model. Defer broader store-boundary refactor.

### 8. Conversation identity and lookup use arrays despite maintaining byId

- **Timing**: `Do after SDK5`
- **Area**: ConversationStore data structure
- **Evidence**: `ConversationStore` maintains `byId`, but `getConversation`, `modifyConversation`, `deleteConversation`, and many callers scan `conversationList` arrays. `addConversation` checks only `conversationId`, not the pair of type and id.
- **Issue**: Lookup semantics are inconsistent and can collide when a single chat, group, or chatroom share an identifier string.
- **Impact**: SDK 5 uses `conversationId` + `conversationType` as the canonical key, so migration should fix keying. A full normalization of list/byId behavior can be done after SDK5 if not necessary for correctness.
- **Recommendation**: During SDK5, canonicalize key creation as `${conversationType}_${conversationId}`. After SDK5, simplify ConversationStore to a normalized map plus ordered id list.
- **SDK5 Follow-up**: The canonical key is a blocker; full normalized-store redesign is post-SDK5.

### 9. EventHandler is global and weakly typed for operation results

- **Timing**: `Do after SDK5`
- **Area**: Public events
- **Evidence**: `eventHandler/index.ts` stores handlers by id and dispatches `success?: () => void` and `error?: (err: ChatSDK.ErrorEvent) => void` for many unrelated operations. Success payloads are not typed and errors are old SDK error types.
- **Issue**: Consumers cannot receive operation-specific success data, and SDK 5 errors/results will not map cleanly to the current generic callback shape.
- **Impact**: SDK5 migration must update error types enough to compile, but redesigning the public event bus is a separate breaking API discussion.
- **Recommendation**: After SDK5, create typed event payloads per operation or replace global eventHandler with scoped callbacks/domain event emitters.
- **SDK5 Follow-up**: Keep minimal SDK 5-compatible error typing in current migration; defer richer event redesign.

### 10. CallKit service is too large and mixes IM, RTC, UI state, audio, and logging concerns

- **Timing**: `Do after SDK5`
- **Area**: CallKit architecture
- **Evidence**: `module/callkit/services/CallService.ts` handles IM signaling, Agora client lifecycle, ringtone, preview cleanup, local/remote track publication, group info caching, timers, logging, and UI status transitions in one large class.
- **Issue**: The service is difficult to reason about and hard to test. SDK5 migration should isolate the IM signaling changes but not attempt a full CallKit redesign.
- **Impact**: Future call regressions are likely unless behavior gets clearer seams and tests.
- **Recommendation**: After SDK5, split CallKit into IM signaling service, RTC session service, media device service, ringtone/timer utilities, and UI state adapter.
- **SDK5 Follow-up**: Do not bundle full CallKit refactor into SDK5.

## Nice To Have

### 11. Generated and exploratory docs are mixed into source directories

- **Timing**: `Nice to have`
- **Area**: Repository hygiene
- **Evidence**: Several guide and analysis files live beside source modules, such as `module/chat/CUSTOM_RENDERER_GUIDE.md`, `module/imageMessage/DESIGN_ANALYSIS.md`, and other module-level migration notes.
- **Issue**: Source directories contain a mix of production code, docs, generated analysis, and examples.
- **Impact**: This does not block SDK5, but it makes code discovery noisier for contributors and AI agents.
- **Recommendation**: Later consolidate long-form docs under `docs/` and keep only short colocated README files where they directly document a module.
- **SDK5 Follow-up**: None.

### 12. Provider and RootContext feature type definitions are duplicated

- **Timing**: `Nice to have`
- **Area**: Types
- **Evidence**: `ProviderProps.features` in `Provider.tsx` and `ContextProps.features` in `rootContext.ts` define overlapping nested shapes manually.
- **Issue**: Feature config changes must be duplicated and can drift.
- **Impact**: It is manageable during SDK5 but can cause omissions.
- **Recommendation**: Later extract shared `UIKitFeatures`, `UIKitTheme`, and `InitConfig` types.
- **SDK5 Follow-up**: During SDK5, at least keep both definitions synchronized.

## Open Questions

- Should `onBeforeSendMessage` remain a public callback with mutable message access, or become a draft-transform callback with explicit send options?
- Should UIKit continue to expose `rootStore` as a public API after SDK5, given how much internal state shape will change?
- Which demos are required release gates for SDK5: only chat/conversation/chatroom/contact/callkit, or every demo entry?

## Resolved Questions

- SDK 5 replacement for legacy `connection.context.jid.clientResource`: use `client.getClientResource()`.

## Future OpenSpec Change Candidates

- `store-boundary-refactor`: split remote SDK commands from MobX state mutation and reduce cross-store direct writes.
- `typed-event-handler`: redesign `eventHandler` with operation-specific success/error payloads and SDK 5 error typing.
- `callkit-service-refactor`: split CallKit IM signaling, RTC session, media device, timer/ringtone, and UI state concerns.
- `conversation-store-normalization`: normalize conversation state around canonical `conversationType + conversationId` keys.
- `docs-source-hygiene`: move long-form module guides and generated analysis out of source directories.
