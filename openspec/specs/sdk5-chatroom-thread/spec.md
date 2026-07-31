## ADDED Requirements

### Requirement: Native SDK 5.0 chatrooms
The UIKit SHALL manage chatroom lifecycle, details, members, member operations, and chatroom events through SDK 5.0 ChatRoomManager.

#### Scenario: Join chatroom
- **WHEN** the Chatroom container mounts with a chatroom ID and login state is active
- **THEN** the UIKit joins through SDK 5.0 `chatRoomManager.joinChatRoom`

#### Scenario: Chatroom message send
- **WHEN** the user sends a chatroom message
- **THEN** the message uses SDK 5.0 `conversationType: 'chatRoom'` and the chatroom ID as `conversationId`

#### Scenario: Chatroom member operation
- **WHEN** the owner mutes, unmutes, or removes a chatroom member
- **THEN** the UIKit calls SDK 5.0 ChatRoomManager or ChatRoom instance APIs

### Requirement: Native SDK 5.0 threads
The UIKit SHALL manage chat threads through SDK 5.0 ChatThreadManager.

#### Scenario: Create thread
- **WHEN** the user creates a thread from a group message
- **THEN** the UIKit calls SDK 5.0 `chatThreadManager.createChatThread`

#### Scenario: Open thread
- **WHEN** the user opens a thread
- **THEN** the UIKit loads thread detail, member list, and thread messages through SDK 5.0 ChatThreadManager and ChatManager APIs

### Requirement: Native SDK 5.0 pinned messages and reactions
The UIKit SHALL manage pinned messages and message reactions through SDK 5.0 ChatManager APIs.

#### Scenario: Pin message
- **WHEN** the user pins or unpins a message
- **THEN** the UIKit calls SDK 5.0 `chatManager.pinMessage` or `chatManager.unpinMessage`

#### Scenario: React to message
- **WHEN** the user adds or removes a reaction
- **THEN** the UIKit calls SDK 5.0 `chatManager.addReaction` or `chatManager.removeReaction`

### Requirement: Native SDK 5.0 message operations
The UIKit SHALL perform translation, recall, modify, and server history deletion through SDK 5.0 ChatManager APIs.

#### Scenario: Recall message
- **WHEN** the user recalls a message
- **THEN** the UIKit calls SDK 5.0 `chatManager.recallMessage`

#### Scenario: Modify message
- **WHEN** the user edits a supported message
- **THEN** the UIKit calls SDK 5.0 `chatManager.modifyMessage` with SDK 5.0 message body semantics
