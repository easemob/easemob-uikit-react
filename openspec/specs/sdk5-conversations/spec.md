## ADDED Requirements

### Requirement: Native SDK 5.0 conversation list
The UIKit SHALL load and store conversations using SDK 5.0 conversation APIs and native conversation fields.

#### Scenario: Conversation list load
- **WHEN** the conversation list requests server conversations
- **THEN** the UIKit calls SDK 5.0 `chatManager.getConversationList`
- **AND** stores each conversation using `conversationId`, `conversationType`, unread count, pin state, and last message from the SDK 5.0 result

### Requirement: Native SDK 5.0 current conversation
The UIKit SHALL identify the active conversation with SDK 5.0 `conversationId` and `conversationType`.

#### Scenario: User selects conversation
- **WHEN** a user clicks a conversation list item
- **THEN** the current conversation is set with SDK 5.0 conversation identifiers

### Requirement: Native SDK 5.0 conversation operations
The UIKit SHALL use SDK 5.0 manager APIs for conversation mutation operations.

#### Scenario: Delete conversation
- **WHEN** the user deletes a conversation
- **THEN** the UIKit calls SDK 5.0 `chatManager.deleteConversation` and updates local conversation state after success

#### Scenario: Mark conversation read
- **WHEN** the current conversation is marked read
- **THEN** the UIKit calls SDK 5.0 `chatManager.markConversationRead`

#### Scenario: Pin conversation
- **WHEN** the user pins or unpins a conversation
- **THEN** the UIKit calls SDK 5.0 `chatManager.setConversationPinned`

### Requirement: Native SDK 5.0 silent mode
The UIKit SHALL use SDK 5.0 PushManager APIs for conversation silent mode.

#### Scenario: Toggle conversation silent mode
- **WHEN** the user mutes or unmutes a conversation
- **THEN** the UIKit calls SDK 5.0 `pushManager.setConversationSilentMode` or `pushManager.clearConversationRemindType`

#### Scenario: Load conversation silent states
- **WHEN** conversation silent states are needed for a list
- **THEN** the UIKit calls SDK 5.0 `pushManager.getConversationSilentModes`
