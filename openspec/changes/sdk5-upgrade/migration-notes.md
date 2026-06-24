# SDK 5 Upgrade Migration Notes

This file records migration issues found while upgrading the UIKit to SDK 5.0. Items here should be reviewed and, when useful beyond this repository, copied into the websdk2 upgrade skill at:

`/Users/zhangdong/code/websdk2/packages/websdk2-ai-kit/src/knowledge/upgrade.md`

## Entry Template

```md
### YYYY-MM-DD - Short title

- **Area**:
- **Old usage**:
- **SDK 5 usage**:
- **Problem**:
- **Resolution**:
- **Skill update candidate**: yes/no
```

## Notes

### 2026-06-22 - Baseline verification

- **Area**: Baseline and verification
- **Old usage**: Project currently depends on `easemob-websdk@^4.19.1`.
- **SDK 5 usage**: Target SDK source is local `file:../websdk2`, currently package `easemob-websdk@0.14.159` with built `dist/` output.
- **Problem**: `npm test -- --run` is not green before SDK migration. `component/checkbox/__tests__/Checkbox.spec.tsx` has two snapshot failures: expected `class="cui-checkbox"` and legacy `checked=""`, received `class="cui-checkbox cui-checkbox-round"` and no `checked=""`. `npm run build` passes before SDK migration, but prints Sass legacy JS API, `@import`, and color function deprecation warnings plus existing build script directory logs.
- **Resolution**: Treat Checkbox snapshot mismatch and Sass warnings as pre-existing baseline issues, not SDK5 migration regressions. Use `npm run build` as the initial compile baseline.
- **Skill update candidate**: yes

### 2026-06-22 - Local SDK package source

- **Area**: Dependency
- **Old usage**: `package.json` uses registry semver range `"easemob-websdk": "^4.19.1"`.
- **SDK 5 usage**: Use `"easemob-websdk": "file:../websdk2"` while upgrading against the local SDK 5 repository.
- **Problem**: The local SDK package version is currently `0.14.159` even though the migration target is the SDK 5 API surface. Agents should not infer API generation from the package semver alone in this local repository.
- **Resolution**: Verify the local SDK exports and docs directly from `/Users/zhangdong/code/websdk2`; the package exposes `ChatClient`, manager classes, and `dist/index.d.ts`.
- **Skill update candidate**: yes

### 2026-06-22 - npm peer resolution during local SDK install

- **Area**: Dependency
- **Old usage**: Running `npm install --package-lock-only --ignore-scripts` after switching the SDK dependency.
- **SDK 5 usage**: `npm install --ignore-scripts --legacy-peer-deps --prefer-offline` completed and installed the local SDK package.
- **Problem**: npm spent a long time resolving existing React/Storybook peer dependency conflicts and did not complete in a reasonable time without `--legacy-peer-deps`.
- **Resolution**: Use `--legacy-peer-deps` for this repository's SDK5 local install path. The peer warnings are pre-existing dependency-tree issues, not SDK5 API errors.
- **Skill update candidate**: yes

### 2026-06-22 - ChatClient initialization is singleton-based

- **Area**: Runtime initialization
- **Old usage**: `new chatSDK.connection(initOptions)` creates a connection instance each time Provider initializes.
- **SDK 5 usage**: `ChatClient.init({ appKey, managers, ... })` returns the SDK singleton and throws if called again with different normalized config.
- **Problem**: Provider render-time initialization and rootStore mutations can repeatedly run with partially changed props. SDK5 singleton semantics make this more visible than the old connection constructor.
- **Resolution**: Build SDK5 init options with `useMemo`, pass a typed manager tuple, and move rootStore/i18n/theme side effects into effects.
- **Skill update candidate**: yes

### 2026-06-22 - SDK5 removes old namespace types

- **Area**: Types
- **Old usage**: App code relies on `ChatSDK.TextMsgBody`, `CustomMsgBody`, `ErrorEvent`, `AsyncResult`, `ThreadChangeInfo`, `PinnedMessageInfo`, and many other SDK4 namespace types.
- **SDK 5 usage**: Import SDK5 native exported types such as `Message`, body-specific types, manager result types, and use `unknown` or SDK runtime error classes for generic error callback plumbing.
- **Problem**: After changing `module/SDK.ts` to re-export SDK5 types, TypeScript reports many missing namespace members. This is expected and should not be fixed by aliasing old SDK4 type names to new types.
- **Resolution**: Migrate each module to SDK5 native types as its data model is migrated. Public generic event error callbacks can accept `unknown` until a narrower SDK5 error type is selected.
- **Skill update candidate**: yes

### 2026-06-22 - Current user and client resource accessors

- **Area**: Runtime, CallKit
- **Old usage**: `client.user`, `client.context.userId`, and `client.context.jid.clientResource`.
- **SDK 5 usage**: `client.getCurrentUserId()` and `client.getClientResource()`.
- **Problem**: Current-user and device-resource reads are scattered through UI modules, stores, and CallKit signaling code.
- **Resolution**: Start replacing current-user reads with a helper backed by `getCurrentUserId()`. CallKit signaling must use `getClientResource()` for `callerDevId`/`calleeDevId` comparisons and payload fields.
- **Skill update candidate**: yes

### 2026-06-22 - CallKit RTC token API shape

- **Area**: CallKit
- **Old usage**: `connection.getRTCToken('*')` returning wrapped `res.data.appId`, `res.data.RTCUId`, and `res.data.RTCToken`.
- **SDK 5 usage**: `client.getRTCTokenInfo({ channelName })` returns `RTCTokenInfo` directly with `appId`, `rtcUid`, `rtcToken`, `channelName`, and `expireAt`.
- **Problem**: CallKit still expects the old wrapped RTC token response while the SDK5 client exposes a direct typed result.
- **Resolution**: Migrate CallKit token acquisition together with the CallKit message signaling migration.
- **Skill update candidate**: yes

### 2026-06-22 - onBeforeSendMessage cannot mutate old route fields

- **Area**: Message creation and send
- **Old usage**: Message input creates a SDK4 message, calls `onBeforeSendMessage(message)`, and lets the callback mutate or redirect by changing `message.to` and `message.chatType`.
- **SDK 5 usage**: Message creation uses explicit `conversationId` and `conversationType`; SDK5 native messages should not grow legacy `to/chatType` fields for routing.
- **Problem**: Migrating individual send points directly would either break `onBeforeSendMessage` redirection or require adding legacy fields to SDK5 messages.
- **Resolution**: Redesign `onBeforeSendMessage` to receive a SDK5-native draft context and return an optional SDK5 route override before calling `chatManager.create*Message`.
- **Skill update candidate**: yes

### 2026-06-22 - Partial migration build failure after SDK entry swap

- **Area**: Verification
- **Old usage**: Modules import `{ chatSDK, ChatSDK }` from `module/SDK.ts`, then call `chatSDK.message.create(...)`, `chatSDK.utils.getFileUrl(...)`, and `chatSDK.utils.download(...)`.
- **SDK 5 usage**: Message creation and sending must go through `client.chatManager.create*Message(...)` and `client.chatManager.sendMessage(...)`. File helpers should move to DOM/File APIs or SDK5 attachment APIs instead of old `chatSDK.utils`.
- **Problem**: After replacing `module/SDK.ts` with SDK5 exports, `npm run build` fails at Rollup binding: `'chatSDK' is not exported by module/SDK.ts, imported by module/store/MessageStore.ts`. TypeScript also reports the remaining old import sites in message input, chatroom, text/audio message, and CallKit.
- **Resolution**: Keep `chatSDK` removed so new code cannot accidentally use SDK4 namespaces. Migrated message input, MessageStore command/read ack paths, chatroom join notice, TextMessage edit creation, AudioMessage attachment download, and CallKit signaling away from old SDK4 namespaces.
- **Skill update candidate**: yes

### 2026-06-22 - OpenSpec telemetry noise in restricted network

- **Area**: Tooling
- **Old usage**: `openspec validate sdk5-upgrade --strict`.
- **SDK 5 usage**: Same.
- **Problem**: Validation succeeds, then OpenSpec prints PostHog flush errors because `edge.openspec.dev` cannot resolve in the restricted network.
- **Resolution**: Treat PostHog `ENOTFOUND` after a successful validation message as telemetry noise, not a spec validation failure.
- **Skill update candidate**: no

### 2026-06-22 - SDK5 package has no default export

- **Area**: Runtime, CallKit
- **Old usage**: `import WebIM from 'easemob-websdk'`, then `WebIM.message.create(...)` or attach globals such as `WebIM.rtc` and `WebIM.conn`.
- **SDK 5 usage**: Import named exports only, inject the SDK5 `ChatClient`, and use `client.chatManager.create*Message(...)` / `sendMessage(...)`.
- **Problem**: After CallKit signaling was migrated, the remaining default import caused Rollup to fail: `'default' is not exported by ../websdk2/dist/index.js`.
- **Resolution**: Remove the default import and old global `WebIM.rtc/conn` assignments. CallKit should keep RTC state inside `CallService` and use the injected SDK5 client.
- **Skill update candidate**: yes

### 2026-06-22 - Attachment helper migration

- **Area**: Message utilities
- **Old usage**: `chatSDK.utils.getFileUrl(input)`, `chatSDK.utils.download(...)`, and `chatSDK.utils.parseDownloadResponse(...)`.
- **SDK 5 usage**: Use browser `File`/`Blob` APIs for selected files and `client.chatManager.downloadAttachment({ message })` for SDK-managed attachment downloads.
- **Problem**: SDK5 does not expose the old `chatSDK.utils` namespace.
- **Resolution**: Message input now passes DOM `File` objects to SDK5 create APIs; AudioMessage downloads via `chatManager.downloadAttachment` and converts the returned `Uint8Array` to a Blob URL.
- **Skill update candidate**: yes

### 2026-06-22 - SDK5 bundle requires a modern build target

- **Area**: Build tooling
- **Old usage**: The UI kit library build used Vite defaults targeting older browsers such as Chrome 87, Edge 88, Firefox 78, and Safari 13.
- **SDK 5 usage**: The local SDK5 bundle contains native BigInt literals in hashing code.
- **Problem**: Vite/esbuild failed during minification with `Big integer literals are not available in the configured target environment`.
- **Resolution**: Set the library build target to `esnext` so SDK5 BigInt syntax is preserved instead of downleveled to unsupported targets.
- **Skill update candidate**: yes

### 2026-06-22 - Message body subtype exports are incomplete

- **Area**: Types
- **Old usage**: SDK4 exposed many flattened `*MsgBody` namespace types, and the UI layer directly read fields such as `msg`, `url`, `thumb`, `filename`, `customEvent`, and `customExts`.
- **SDK 5 usage**: Renderers should consume `Message` plus `message.body.*` fields. Body-specific type names such as `TextMessageBody`, `ImageMessageBody`, `FileMessageBody`, and `VideoMessageBody` exist in SDK source but are not all exported from the current package entry.
- **Problem**: Consumers can import `MessageBody` but cannot narrow to all body-specific interfaces through the package entry, causing TypeScript errors when migrating renderers without falling back to old SDK4 type names.
- **Resolution**: The UI kit added a local SDK5 message reader helper and temporary body-shape types for renderer migration. SDK5 should export all public body subtype interfaces from the package entry so applications do not need local structural copies.
- **Skill update candidate**: yes

### 2026-06-22 - Manager pagination response shape changed

- **Area**: Group and list APIs
- **Old usage**: Some APIs returned wrapped `{ data, isLast }` results and accepted `pageNum`.
- **SDK 5 usage**: Manager APIs such as `groupManager.getGroupMemberList` return direct typed results with `items`, `cursor`, and `hasMore`.
- **Problem**: Directly changing the method name but keeping `response.data`, `response.isLast`, or `pageNum` can compile in loose areas while repeatedly fetching the first page or dropping data.
- **Resolution**: Read `items`, extract `item.user.userId`, and persist `cursor` between calls while `hasMore` is true.
- **Skill update candidate**: yes

### 2026-06-22 - Chatroom member list moved to cursor pagination

- **Area**: Chatroom APIs
- **Old usage**: `client.listChatRoomMembers({ chatRoomId, pageSize, pageNum })` returned a wrapper with `data` member entries and sometimes a `count` used by UI stores.
- **SDK 5 usage**: `client.chatRoomManager.getMemberList({ chatRoomId, pageSize, cursor })` returns `{ items, cursor, hasMore }`; member IDs live at `item.user.userId`.
- **Problem**: Keeping `pageNum`, `res.data`, or `res.count` after renaming the method either fails type-checking or reintroduces an SDK4-shaped contract.
- **Resolution**: Store cursor state in the hook/component, update `next` from `hasMore`, derive member IDs from `items`, and update local member count from the actual accumulated/known member list unless SDK5 exposes a total count field.
- **Skill update candidate**: yes

### 2026-06-22 - Report message API not found in current SDK5 public managers

- **Area**: Message operations
- **Old usage**: `client.reportMessage({ messageId, reportType, reportReason })`.
- **SDK 5 usage**: No equivalent public manager method was found in the current local SDK source during migration.
- **Problem**: Chat and Chatroom report flows cannot be migrated by a simple manager rename.
- **Resolution**: Leave as an explicit SDK/API gap for confirmation instead of adding an SDK4 compatibility shim or silently dropping the UI action.
- **Skill update candidate**: yes

### 2026-06-22 - Combine message download/parse API not found in current SDK5 public client

- **Area**: Combine messages
- **Old usage**: `client.downloadAndParseCombineMessage({ url, secret })` downloaded and parsed the forwarded chat history payload for local detail rendering.
- **SDK 5 usage**: Current public SDK5 client/managers do not expose a direct equivalent in the installed `dist` declarations.
- **Problem**: Keeping the old call fails type-checking and would fail at runtime. Mapping combine message data into an old `CombineMsgBody` shape would violate the SDK5-native migration direction.
- **Resolution**: Render already-present local `messageList/messages` when available; otherwise surface an explicit SDK/API gap until SDK5 exposes the public download/parse operation or the product confirms a replacement flow.
- **Skill update candidate**: yes

### 2026-06-22 - WithManagers inference can erase manager methods

- **Area**: Types
- **Old usage**: The UI kit treated the SDK connection as a broad object and called methods directly.
- **SDK 5 usage**: `ChatClient.init({ managers })` attaches manager instances such as `chatManager`, `groupManager`, and `chatRoomManager`.
- **Problem**: In this consumer, `WithManagers<ChatClient, typeof UIKitManagers>` inferred manager properties as `ManagerBase<ChatClient>`, so valid calls such as `client.chatManager.downloadAttachment(...)` and `client.groupManager.getGroupMemberList(...)` were reported as missing.
- **Resolution**: Define the UI kit client type explicitly as `ChatClient & { chatManager: ChatManager; groupManager: GroupManager; ... }` until SDK manager tuple inference is confirmed or improved.
- **Skill update candidate**: yes

### 2026-06-22 - Message body is not a full message

- **Area**: Message store and renderers
- **Old usage**: UI code typed list items, replied messages, and RTC invitation callbacks as `ChatSDK.MessageBody`, then read `from`, `to`, `id`, `mid`, `chatType`, `status`, and `ext` from that object.
- **SDK 5 usage**: Store and render complete `ChatSDK.Message` objects. Message bodies live under `message.body` and contain only payload fields.
- **Problem**: Keeping `MessageBody` as the list item type hides SDK5 routing/status fields and triggers a long tail of incorrect old-field reads.
- **Resolution**: Migrate list/render APIs to accept `Message | NoticeMessageBody`, use helpers such as `getMessageId`, `getTextContent`, `getCustomEvent`, and pass full SDK5 messages to callbacks.
- **Skill update candidate**: yes

### 2026-06-22 - SDK5 event system splits old aggregate events

- **Area**: Events
- **Old usage**: `onTextMessage`, `onImageMessage`, `onCmdMessage`, `onReadMessage`, `onDeliveredMessage`, `onRecallMessage`, `onReactionChange`, `onModifiedMessage`, `onMessagePinEvent`, `onGroupEvent`, `onGroupChange`, `onChatThreadChange`, `onMultiDeviceEvent`, and `onChatroomEvent`.
- **SDK 5 usage**: Use `onMessage` and switch on `message.type`; message state events are `onMessageRead`, `onMessageDelivered`, `onConversationRead`, `onMessageRecalled`, `onMessageUpdated`, `onReactionChanged`, and `onPinnedMessageChanged`. Group and thread events are split into named events such as `onAdminAdded`, `onMembersJoined`, `onOwnerChanged`, `onGroupMemberAttributeChanged`, `onChatThreadCreated`, `onChatThreadUpdated`, `onChatThreadDestroyed`, and `onChatThreadUserRemoved`. Multi-device conversation events use `onMultiDeviceConversation`.
- **Problem**: Registering old event names no longer type-checks and would silently miss SDK5 events at runtime.
- **Resolution**: Replace aggregate handlers with SDK5 named handlers. Do not preserve old `operation/type` payload dispatch as the public event contract; only adapt internally where a not-yet-migrated local store still expects old operation names.
- **Skill update candidate**: yes

### 2026-06-22 - UI message status must be decoupled from SDK message status

- **Area**: Message types
- **Old usage**: Local UI message types used status values such as `received` and `default`, while also extending or intersecting with SDK message types.
- **SDK 5 usage**: SDK message status is `sending | sent | failed | delivered | read`; UI-only display states should be local extension fields, not part of the SDK message contract.
- **Problem**: `Partial<ChatSDK.Message> & { status?: string }` still keeps the SDK `status` intersection and makes local renderer message types unassignable.
- **Resolution**: Omit SDK fields that the UI extends (`status`, `body`, `type`) before redefining UI-facing structural message props. Keep SDK5 `Message` as the store/network data model.
- **Skill update candidate**: yes

### 2026-06-22 - Contact, group, chatroom, push, and presence APIs moved to managers

- **Area**: Managers and stores
- **Old usage**: Store code called `client.setContactRemark`, `client.deleteContact`, `client.addContact`, `client.createGroup`, `client.modifyGroup`, `client.destroyGroup`, `client.leaveGroup`, `client.inviteUsersToGroup`, `client.removeGroupMembers`, `client.changeGroupOwner`, `client.getSilentModeForConversations`, `client.setSilentModeForConversation`, `client.clearRemindTypeForConversation`, `client.publishPresence`, and old chatroom member methods directly.
- **SDK 5 usage**: Use `contactManager`, `groupManager`, `chatRoomManager`, `pushManager`, and `presenceManager`. Examples: `contactManager.setContactRemark({ userId, remark })`, `groupManager.createGroup({ name, description, memberIds, ... })`, `groupManager.updateGroupInfo(...)`, `chatRoomManager.muteMembers(...)`, `pushManager.getConversationSilentModes(...)`, `pushManager.setConversationSilentMode(...)`, `pushManager.clearConversationRemindType(...)`, `presenceManager.publishPresence({ customStatus })`.
- **Problem**: Direct method renames are not enough; parameter names and return values changed (`groupid/groupname` -> `groupId/name`, `users` -> `userIds`, `res.data.groupid` -> direct `res.groupId`).
- **Resolution**: Migrate store types to SDK5 field names and update local caches using SDK5 result shapes.
- **Skill update candidate**: yes

### 2026-06-22 - Local SDK source and dist declarations can differ

- **Area**: SDK local package consumption
- **Old usage**: Read SDK source types and assume they match the installed local `file:` package declarations.
- **SDK 5 usage**: The consuming project type-checks against `/Users/zhangdong/code/websdk2/dist/*.d.ts`.
- **Problem**: `RefreshSessionListParams` in source used `includeEmpty`, while the installed dist declaration used `needEmptySession`. Migration code based on source failed against the actual dependency declarations.
- **Resolution**: When using the local SDK as a `file:` dependency, verify both source and `dist` declarations. Prefer the installed `dist` API for consumer compilation, and record mismatches for SDK-side rebuild/export cleanup.
- **Skill update candidate**: yes

### 2026-06-22 - ChatThread APIs return SDK5 summaries directly

- **Area**: ChatThread APIs and UI renderers
- **Old usage**: Thread code called direct client methods such as `createChatThread`, `getChatThreads`, `getChatThreadDetail`, `getChatThreadMembers`, `removeChatThreadMember`, `leaveChatThread`, `destroyChatThread`, and `changeChatThreadName`. UI renderers opened threads through `chatThreadOverview.id`, and creation expected wrapped results such as `res.data.chatThreadId`.
- **SDK 5 usage**: Use `client.chatThreadManager.*` methods. Creation returns `CreateChatThreadResult` directly with `chatThreadId`; summaries/details are `ChatThreadSummary`/`ChatThreadDetail` with `chatThreadId`, `ownerId`, `createdAt`, `items`, and `cursor`. Last-message data is `MessageSnippet`, not a full `Message`.
- **Problem**: Renaming methods without changing result access leaves `res.data` undefined and makes thread title clicks fail when SDK5 provides `chatThreadId` instead of old `id`. Treating `MessageSnippet` as a full message also reintroduces old `msg/from/time` assumptions.
- **Resolution**: Route all thread lifecycle and list/member calls through `chatThreadManager`, read `chatThreadId` directly, and render snippets with their `type`, `body`, and `timestamp`. UI-only helpers may read both `chatThreadId` and historical `id` at component boundaries, but stores and manager calls should preserve SDK5 summary/result shapes.
- **Skill update candidate**: yes

### 2026-06-22 - Pinned summaries contain full SDK5 messages

- **Area**: Pinned message rendering
- **Old usage**: `PinnedMessageInfo.message` was treated as a flattened text body and read through `message.to`, `message.mid`, `message.id`, and `message.msg`.
- **SDK 5 usage**: `PinnedMessageSummary` carries `messageId`, `conversationId`, `conversationType`, `operatorId`, `pinnedAt`, and an optional full SDK5 `message`. Text content is `message.body.content`; unpin should use `summary.messageId` or a SDK5 message id helper.
- **Problem**: Reading the nested message as an SDK4 body drops conversation metadata and breaks text display/unpin for SDK5 messages.
- **Resolution**: Render pinned text from `summary.message.body.content`, initialize pinned hooks from `summary.conversationId/conversationType`, and compare the operator to `client.getCurrentUserId()`.
- **Skill update candidate**: yes

### 2026-06-22 - Reply quote metadata is business ext, not the message model

- **Area**: Replied message rendering
- **Old usage**: Replied message components typed message list items as `MessageBody` and rendered quoted originals through flattened fields such as `msg`, `thumb`, `url`, `filename`, `customEvent`, and `customExts`. The `ext.msgQuote` metadata may contain historical type values such as `txt`, `img`, and `audio`.
- **SDK 5 usage**: Store and search full SDK5 `Message` objects by `msgServerId/msgLocalId`; render original content from `message.body.*`. `ext.msgQuote` can remain a UI/business quote metadata payload, but it should not drive conversion of the SDK5 message into SDK4 shape.
- **Problem**: Conflating `MessageBody` with full `Message` hides `from`, `conversationId`, ids, status, and ext. At the same time, old persisted `msgQuote.msgType` values still need to be recognized for display.
- **Resolution**: Keep `ext.msgQuote` as metadata, support both legacy quote type strings and SDK5 message type strings at the UI boundary, and render found originals from SDK5 `Message.body`. Use local structural body readers when the current SDK package entry does not export every body subtype interface.
- **Skill update candidate**: yes

### 2026-06-23 - Storybook and demo mocks should use SDK5 messages

- **Area**: Stories and demos
- **Old usage**: Storybook and demo examples constructed old flattened mock messages with `id`, `time`, `chatType`, `msg`, `filename`, `length`, `customEvent`, `customExts`, and `type: 'txt' | 'audio'`. Some demos also called `client.open({ user, pwd })` or `ChatSDK.message.create(...)`.
- **SDK 5 usage**: Mock messages should include SDK5 message envelope fields such as `msgLocalId`, `msgServerId`, `conversationId`, `conversationType`, `timestamp`, `direct`, `sender`, `type`, and `body`. Demo sends should use `client.login({ userId, token })` and `client.chatManager.create*Message(...)`.
- **Problem**: Even after runtime modules migrate, old examples keep TypeScript red and can mislead future implementation agents into reintroducing SDK4 fields.
- **Resolution**: Convert module stories and explicit SDK4 demo message/API usages to SDK5 shapes. Full `tsc` still reports unrelated historical demo/component issues such as broken path aliases, obsolete component props, and non-SDK demo typing; keep those separate from SDK5 data-model migration.
- **Skill update candidate**: yes

## Session: Message/Conversation Model Convergence (2026-06-23)

### Completed

1. **MessageStore - unified message indexing**
   - `updateMessageStatus`: replaced direct `.id`/`.mid`/`.chatType` access with `getMessageId`/`getMessageChatType` helpers
   - `deleteMessage`: replaced `.id`/`.mid` filter with `getMessageId`
   - `receiveMessage`: removed direct `bySelf = true/false` assignment; SDK5 messages use `direct` field, renderers fallback to `from === currentUserId`
   - `sendSdk5Message` msgQuote: replaced `(msg as any).msg` with `getTextContent(msg)`
   - `byId` map properly indexes by `msgLocalId` (before send) and both `msgLocalId`+`msgServerId` (after send success)

2. **SelectedControls - SDK5 field access**
   - Replaced `msg.msg` with `getTextContent(msg)`
   - Replaced `a.time - b.time` with `getMessageTime(a) - getMessageTime(b)`
   - Replaced `msg.mid || msg.id` with `getMessageId(msg)`
   - Added `'text'`/`'voice'`/`'image'` cases to switch alongside old `'txt'`/`'audio'`/`'img'`

3. **CombinedMessage - SDK5 field access**
   - Replaced all `combinedMessage.mid || combinedMessage.id` with `getMessageId(combinedMessage)`
   - Replaced `key={msg.id}` with `key={getMessageId(msg)}` in sub-message rendering
   - Replaced destructured `time` with `getMessageTime(combinedMessage)`
   - Replaced `id={combinedMessage.id}` with `id={getMessageId(combinedMessage)}`

4. **MessageList - SDK5 type normalizer**
   - Expanded `MessageType` union to include both old (`txt`/`img`/`audio`/`loc`) and new (`text`/`image`/`voice`/`location`) names
   - Added type normalizer before renderer lookup: `text→txt`, `image→img`, `voice→audio`, `location→loc`
   - Changed `useMemo` type from `Record<>` to `Partial<Record<>>` to allow incomplete key coverage

5. **MoreAction - renamed local vars**
   - Renamed `customEvent`/`customExts` local variables to `event`/`params` (they were only local names, already correctly used in `createCustomMessage({ event, params })`)

6. **Chat.tsx**
   - Replaced `message.mid || message.id` with `getMessageId(message)` in report handler

### Key Discoveries

- **SDK5 MessageType naming**: `'text'`/`'image'`/`'voice'`/`'location'` vs old `'txt'`/`'img'`/`'audio'`/`'loc'`. UIKit renderers keep old keys with a normalizer layer.
- **SDK5 doesn't export `MessageStatus`**: must use `as any` or `Message['status']` type derivation.
- **`reportMessage`**: no SDK5 public API. Dispatches error event as documented gap.
- **ConversationStore**: already fully converged to SDK5, no changes needed.
- **All message operations**: already using SDK5 ChatManager APIs.

### Remaining work (not addressed this session)

- 4.6: Audio/voice message full-chain (body.duration) audit
- 4.9: Combine message SDK5 remote detail download/parse
- 4.11: selected/typing/status audit
- 3.5: Chatroom events migration
- 3.7/3.8: eventHandler and SDK event callback audit
- 6.4/6.5: markConversationRead/setConversationPinned (already in ConversationStore but tasks not verified)
- 5.6: createCmdMessage (already used in sendTypingCmd but not all paths checked)
- 7.x: Contact/Group/Presence long-tail API audit
- 9.x: CallKit signaling
- 10.x: Docs/demos
- 11.3: Reduce remaining @ts-ignore
