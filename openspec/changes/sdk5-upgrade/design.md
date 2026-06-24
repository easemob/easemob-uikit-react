## Context

This React UIKit is built around the legacy `easemob-websdk@4.x` API. The root `Provider` creates a `connection`, stores it in `rootStore.client`, and almost every feature module directly reads old fields such as `client.user`, `client.context.userId`, `message.chatType`, `message.msg`, `message.mid`, and `message.id`.

SDK 5.0 changes the architecture to `ChatClient` plus managers. APIs move from the connection instance to `chatManager`, `contactManager`, `groupManager`, `chatRoomManager`, `presenceManager`, `pushManager`, `userInfoManager`, and `chatThreadManager`. Messages and conversations also use new native fields. This is a cross-cutting migration that affects runtime initialization, event handling, state stores, UI rendering, demos, docs, and CallKit.

## Goals / Non-Goals

**Goals:**

- Use SDK 5.0 `ChatClient` and managers as the only SDK runtime.
- Use SDK 5.0 native message and conversation data as the internal source of truth.
- Remove legacy SDK creation, login, send, event, and manager-like API usage.
- Keep the UIKit feature set functionally equivalent where SDK 5.0 supports the capability.
- Make the migration verifiable through OpenSpec tasks, build checks, targeted tests, demos, and legacy API search checks.

**Non-Goals:**

- Do not convert SDK 5.0 messages into legacy SDK message shapes.
- Do not keep legacy message fields as internal primary model fields.
- Do not redesign visual UI, styling, layout, or component hierarchy beyond what the SDK 5.0 data model requires.
- Do not implement unsupported SDK 4.x behavior, such as password login.
- Do not perform unrelated refactors or dependency upgrades.

## Decisions

### Use SDK 5.0 native model end to end

All stores and components will be migrated to the SDK 5.0 model instead of introducing a compatibility adapter that emulates SDK 4.x.

Rationale: compatibility would reduce initial edits but preserve obsolete field semantics across the codebase, making future SDK 5.0 features harder to adopt and increasing long-term risk.

Alternative considered: add a facade that exposes old `connection` methods and old message fields. Rejected because the user explicitly wants a complete migration, and because message rendering, operations, history, and event handling would keep depending on deprecated concepts.

### Register all required managers in Provider

`Provider` will initialize `ChatClient` with the managers needed by the UIKit: Chat, Contact, Group, ChatRoom, Presence, Push, UserInfo, and ChatThread.

Rationale: UIKit exports a broad feature surface and needs these managers available consistently through `RootContext`.

Alternative considered: lazy register managers per feature. Rejected for the first migration because it complicates types and failure modes. Lazy registration can be revisited after the migration stabilizes.

### Treat SDK 5.0 return values as canonical

The code will stop expecting `AsyncResult<T>` wrappers and `res.data` for SDK 5.0 manager APIs. Stores and hooks will use direct Promise return values as documented by SDK 5.0.

Rationale: SDK 5.0 intentionally returns typed data directly. Preserving old wrapper expectations would introduce inconsistent result handling.

### Replace current-user access globally

All current-user reads will use `client.getCurrentUserId()` or a small local helper that calls it. The helper may exist to reduce repetition, but it must not expose legacy `client.user` or `client.context.userId` as a primary API.

Rationale: direct `client.user` and `client.context.userId` do not exist in the SDK 5.0 contract.

### Split message identity into local and server IDs

Message storage will account for both `msgLocalId` and `msgServerId`. Sending-state UI may index by local ID before server acknowledgement; server operations must use server IDs.

Rationale: SDK 5.0 separates local and server identifiers. Treating one as a universal replacement for old `id/mid` would produce incorrect resend, recall, delete, pin, and reaction behavior.

### Migrate CallKit separately

CallKit will be migrated after core chat, conversation, address book, chatroom, and message operations are stable.

Rationale: CallKit mixes IM signaling and Agora RTC behavior, and the file `module/callkit/services/CallService.ts` has many direct old `WebIM.message.create` and `connection.send` calls. Separating it lowers regression risk.

## Risks / Trade-offs

- Message model churn affects most module components -> mitigate by migrating store types and message renderers in one focused phase, then validating all message types.
- Existing demos and stories use legacy mock data -> mitigate by updating mocks in the docs/demos phase and using demo checks as acceptance criteria.
- SDK 5.0 manager API coverage may differ from legacy API -> mitigate by checking websdk2 API reference before each manager migration and marking unsupported legacy behaviors as removed.
- Password login removal can break users relying on `initConfig.password` -> mitigate with migration notes and runtime/type-level deprecation.
- CallKit migration can regress signaling -> mitigate with a dedicated CallKit phase and manual call-flow validation.
- Build may remain red during intermediate PRs if all modules are migrated at once -> mitigate by keeping PRs ordered by dependency and using temporary compile-focused checkpoints.

## Migration Plan

1. Establish baseline build/test/demo results and record known pre-existing failures.
2. Update SDK dependency and root SDK exports.
3. Rewrite `Provider`, RootStore types, RootContext, and current-user access.
4. Migrate SDK event registration and store event handling.
5. Migrate MessageStore and message renderers to SDK 5.0 native `Message`.
6. Migrate message creation and sending.
7. Migrate conversations and push silent mode.
8. Migrate contacts, user info, presence, groups, and group events.
9. Migrate chatroom, thread, pinned message, reaction, translation, recall, and modify flows.
10. Migrate CallKit.
11. Update docs, demos, stories, and AGENTS guidance.
12. Run cleanup searches and final validation.

Rollback strategy: keep the migration on a dedicated branch. If a phase produces unacceptable regressions, revert that phase PR rather than trying to support SDK 4.x and SDK 5.0 simultaneously in the same code path.

## Open Questions

- Which exact SDK 5.0 package source should this repo consume during development: published npm version, local file dependency, workspace link, or npm link to `/Users/zhangdong/code/websdk2`?
- Should exported TypeScript types intentionally break to SDK 5.0 names immediately, or should some old type aliases remain temporarily as deprecated aliases without changing runtime data?
- Which demos are required as release gates for this migration?
