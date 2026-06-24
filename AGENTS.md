# Agent Guide

This repository is a React component library for quickly building IM applications on top of the `easemob-websdk` Chat SDK. The public package exposes three levels of UI:

- Container/page-level components such as `Chat`, `ConversationList`, `Chatroom`, `ContactList`, `Blocklist`, and `CallKit`.
- Module-level IM components under `module/`, such as message renderers, message input, conversation items, group/member panels, thread and pinned-message views.
- Pure UI components under `component/`, such as `Button`, `Avatar`, `Input`, `Modal`, `Dropdown`, `Tooltip`, `ScrollList`, and `UserItem`.

Use this file as the first stop before implementing features. Prefer existing patterns in the nearby component, store, hook, and style files.

## Tech Stack

- React 18 + TypeScript.
- Vite library build, with `vite-plugin-dts` for declarations and `vite-plugin-svgr` for SVG imports.
- `easemob-websdk` 5.0 (`im-sdk-web`) as the IM SDK. Uses `ChatClient` + manager architecture (ChatManager, ContactManager, GroupManager, ChatRoomManager, PresenceManager, PushManager, UserInfoManager, ChatThreadManager). Do NOT use legacy SDK 4.x APIs or data shapes.
- MobX + `mobx-react-lite` for global UIKit state.
- SCSS for component and module styling.
- `i18next` + `react-i18next` for localization.
- Vitest + happy-dom for tests.
- Storybook 6 for component examples.
- Agora RTC SDK is used by CallKit-related functionality.

## Important Commands

- Install dependencies: `npm install`
- Start local demos: `npm run dev`
- Build library: `npm run build`
- Build all with Vite config: `npm run build:all`
- Run tests: `npm test`
- Run docs locally: `npm run docs:dev`
- Run Storybook: `npm run storybook`

The README demo URLs use the Vite dev server, for example `http://localhost:5173/demo/module/chat/index.html`.

## Project Layout

- `index.ts`: public package entry. New public exports should usually be wired here.
- `module/index.ts`: central export surface for IM modules, container components, stores, hooks, and module types.
- `component/entry.ts`: central export surface for pure UI components and their types.
- `module/SDK.ts`: Chat SDK re-export/wrapper point used by the rest of the UIKit.
- `module/store/`: MobX stores and provider context.
- `module/hooks/`: hooks that connect components to the SDK, stores, screen state, conversation context, chatroom context, user info, history messages, pinned messages, and threads.
- `module/<feature>/`: IM feature modules. Most modules include `index.ts`, one or more `.tsx` files, and `style/`.
- `component/<component>/`: pure UI components. Most include `index.ts`, component implementation, optional stories/tests, and `style/`.
- `component/style/` and `common/style/`: shared style tokens, mixins, core styles, themes, and colors.
- `local/`: built-in i18n resources.
- `eventHandler/`: global success/error event callback dispatcher.
- `demo/`: runnable demo entry points for modules, containers, and examples.
- `docs/`: VitePress documentation.
- `scripts/build.ts`: library build helper that also copies SCSS into `build/style`.

There is no separate root `container/` directory. Page/container-level components are exported from `module/` and the root entry.

## Runtime Architecture

The UIKit has three main layers:

1. UI components render the IM experience and expose render props/config props for customization.
2. MobX stores under `module/store/` hold global state for messages, conversations, contacts/groups, threads, and pinned messages.
3. `easemob-websdk` performs network/IM operations. SDK events are listened to by hooks and translated into store updates.

`Provider` in `module/store/Provider.tsx` is the root runtime boundary. It:

- Creates a `chatSDK.connection` with `initConfig`.
- Stores the client and init config on the singleton `rootStore`.
- Registers SDK event handling through `useEventHandler`.
- Initializes i18n resources.
- Applies theme color generation.
- Provides `RootContext` values: `rootStore`, `client`, `initConfig`, `features`, `theme`, `reactionConfig`, and `presenceMap`.
- Opens the SDK connection automatically when `initConfig.userId` plus `token` or `password` is provided.

Most feature components read `RootContext` directly and are wrapped with `observer` when they need reactive MobX rendering.

## Stores

The singleton `rootStore` is created in `module/store/index.ts`.

- `messageStore`: message lists, send/receive state, message status, reactions, reply state, selection state, recall/modify behavior.
- `conversationStore`: conversation list, current conversation, search list, unread state, server pinned conversation operations.
- `addressStore`: contacts, groups, members, user info, presence, group details.
- `threadStore`: thread data and thread panel visibility/state.
- `pinnedMessagesStore`: pinned message state and pin/unpin notice messages.

When adding stateful behavior, prefer adding actions to the relevant store and calling those actions from hooks/components. Do not duplicate source-of-truth state in components unless it is purely transient UI state.

## SDK Event Flow

`module/hooks/chat.ts` registers the main SDK event handler. Message events call `messageStore.receiveMessage`, status events update local message status, connection events update `rootStore.loginState`, and group/thread/pin/reaction events update their corresponding stores.

When adding a new SDK-driven feature:

- Check whether the SDK event belongs in `module/hooks/chat.ts`.
- Keep server operations in hooks/stores or existing module action handlers.
- Dispatch success/error through `eventHandler` when the operation is part of the public event surface.
- Update local MobX state after successful SDK operations, or optimistically only when that is already the local pattern.

## Public Events

`eventHandler/index.ts` exposes a singleton dispatcher and the `EventName` union. `Provider` accepts event handler data through the hook wiring in `useEventHandler`.

When adding a public operation that consumers may need to observe:

- Add the event name to `EventName`.
- Dispatch success with `eventHandler.dispatchSuccess(name)`.
- Dispatch errors with `eventHandler.dispatchError(name, err)`.
- Preserve the global `onError` behavior.

## Component Patterns

Common patterns in module/container components:

- Props usually include `prefix`, `className`, `style`, render override props, and nested props for child modules.
- Class names are derived with `ConfigContext.getPrefixCls`.
- Theme mode is usually appended as `${prefixCls}-${themeMode}`.
- Components read feature gates from `RootContext.features`.
- Components read translations with `useTranslation`.
- Components that render MobX state should be exported through `observer`.
- Many customization points use render props such as `renderHeader`, `renderMessageList`, `renderMessageInput`, `renderItem`, or `renderEmpty`.

Before adding new props, check the closest existing module for naming and feature-gate style.

## Styling

- Styles are SCSS and live beside the component/module in `style/`.
- Module components commonly import `./style/style.scss`.
- Shared style foundations are in `component/style/`, `common/style/`, and `module/styles/`.
- Use existing prefix class naming and theme-mode modifiers instead of unrelated class names.
- Build output copies style files through `scripts/build.ts`, so new component/module style directories should follow existing `style/` conventions.

## Localization

Built-in language resources are in `local/en.json`, `local/zh.json`, and `local/resource.js`.

When adding user-visible strings:

- Add keys to both English and Chinese resource files.
- Use `useTranslation()` in components.
- Avoid hard-coded display strings unless the nearby code already uses protocol-like action constants.

## Feature Flags And Customization

`ProviderProps.features` controls much of the built-in behavior for chat, conversation list, chatroom, and chatroom members.

Examples:

- `features.chat.header.threadList`
- `features.chat.message.reply`
- `features.chat.messageInput.emoji`
- `features.conversationList.item.pinConversation`
- `features.chatroom.message.translate`
- `features.chatroomMember.mute`

When adding optional behavior, prefer extending `features` in `ProviderProps` and `RootContext.ContextProps`, then consume the flag in the relevant component. Keep defaults compatible with current behavior.

## Exports

If a new public component, hook, or type is added:

1. Export it from its local `index.ts`.
2. Export it from `module/index.ts` or `component/entry.ts`.
3. Export it from root `index.ts` if it should be part of the package API.
4. Include its props/types in the relevant `export type` block.

Avoid changing public names casually. This package is consumed as a UI library.

## Tests, Stories, And Demos

- Existing tests live beside components, for example `component/checkbox/__tests__`.
- Stories are usually `*.stories.tsx` beside components/modules.
- Runnable examples live in `demo/`.

For low-risk visual or prop additions, a Storybook story or demo update can be enough. For store logic, hooks, data transforms, or regressions, add or update Vitest coverage.

## Build Notes

The Vite library build uses `index.ts` as the entry and outputs to `build/`. `react`, `react-dom`, `mobx`, and `mobx-react-lite` are externalized for library builds.

`scripts/build.ts` runs Vite, writes a package file into `build/`, and copies SCSS style directories into `build/style`. If a new module needs distributed styles, make sure its style directory matches the existing structure.

## Implementation Checklist For AI Agents

Before editing:

- Locate the relevant layer: pure UI in `component/`, IM module/container in `module/`, state in `module/store/`, SDK event handling in `module/hooks/chat.ts`.
- Read the nearby component, store, hook, style, and export files.
- Check whether the feature needs i18n, feature flags, event handler support, demos/stories, or public exports.

While editing:

- Preserve existing API shape and naming conventions.
- Keep source-of-truth state in MobX stores.
- Use `RootContext`, existing hooks, and store actions instead of creating parallel SDK clients.
- Keep render customization and feature gates consistent with nearby modules.
- Update TypeScript interfaces in both `ProviderProps` and `ContextProps` when changing provider-level config.
- Update all export surfaces for public additions.

Before finishing:

- Run a focused command where practical, such as `npm test`, `npm run build`, or a targeted demo build.
- If the change affects styles, inspect the relevant demo or Storybook story.
- Mention any command that could not be run.

## Common Change Locations

- Chat page behavior: `module/chat/Chat.tsx`, `module/chat/MessageList.tsx`, `module/messageInput/`, `module/store/MessageStore.ts`.
- Conversation list behavior: `module/conversation/ConversationList.tsx`, `module/conversation/ConversationItem.tsx`, `module/store/ConversationStore.ts`.
- Chatroom behavior: `module/chatroom/`, `module/chatroomMessage/`, `module/chatroomMember/`.
- Contacts/groups: `module/contactList/`, `module/groupDetail/`, `module/groupMember/`, `module/store/AddressStore.ts`.
- Threads: `module/thread/`, `module/store/ThreadStore.ts`.
- Pinned messages: `module/pinnedMessage/`, `module/pinnedTextMessage/`, `module/store/PinnedMessagesStore.ts`.
- CallKit: `module/callkit/` and `demo/callkit/`.
- Shared UI primitives: `component/`.
- Package API: root `index.ts`, `module/index.ts`, `component/entry.ts`.

## SDK Migration Notice

This project has been fully migrated to SDK 5.0 (`im-sdk-web`) native APIs and data model. AI agents and contributors MUST NOT:

- Reintroduce legacy SDK 4.x APIs (`WebIM.message.create`, `conn.send`, `new SDK.connection`, `conn.open`).
- Use legacy message fields as primary model (`message.msg`, `message.mid`, `message.id`, `message.chatType`, `message.time`, `message.bySelf`, `customEvent`, `customExts`).
- Create compatibility shims that convert SDK 5.0 data back to SDK 4.x shapes.

Instead use:

- `ChatClient` + managers (`chatManager`, `contactManager`, `groupManager`, `chatRoomManager`, `presenceManager`, `pushManager`, `userInfoManager`, `chatThreadManager`).
- SDK 5.0 native `Message` with `msgLocalId`, `msgServerId`, `conversationId`, `conversationType`, `timestamp`, `direct`, `body.*`.
- Helper functions in `module/utils/message.ts` (`getMessageId`, `getMessageTime`, `getMessageChatType`, `getTextContent`, `isMessageFromCurrentUser`, etc.) for backward-compatible field access.
