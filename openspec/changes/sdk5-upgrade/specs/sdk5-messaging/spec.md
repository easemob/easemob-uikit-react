## ADDED Requirements

### Requirement: Native SDK 5.0 message model
The UIKit SHALL store, render, and operate on SDK 5.0 native `Message` objects as its internal message source of truth.

#### Scenario: Text message rendering
- **WHEN** a text message is rendered
- **THEN** the text content is read from the SDK 5.0 message body rather than a legacy `msg` field

#### Scenario: Message conversation routing
- **WHEN** a message is added to a store conversation bucket
- **THEN** the bucket is selected by `conversationType` and `conversationId`

#### Scenario: Message identity tracking
- **WHEN** a message is pending server acknowledgement
- **THEN** local UI state can track it by `msgLocalId`
- **AND** server-side operations use `msgServerId` after it is available

### Requirement: Native SDK 5.0 message creation and send
The UIKit SHALL create and send messages through SDK 5.0 `chatManager` message factory methods and `sendMessage`.

#### Scenario: Text message send
- **WHEN** the user sends text from the message input
- **THEN** the UIKit creates a SDK 5.0 text message with `createTextMessage` and sends it with `chatManager.sendMessage`

#### Scenario: Attachment message send
- **WHEN** the user sends an image, voice, video, or file message
- **THEN** the UIKit creates the corresponding SDK 5.0 attachment message type and sends it with SDK 5.0 send options as needed

#### Scenario: Custom and command message send
- **WHEN** the UIKit sends custom, command, or combine messages
- **THEN** it uses SDK 5.0 `createCustomMessage`, `createCmdMessage`, or `createCombineMessage`

### Requirement: SDK 5.0 message events
The UIKit SHALL receive and process messages through SDK 5.0 message events.

#### Scenario: Incoming message
- **WHEN** SDK 5.0 emits `onMessage`
- **THEN** the UIKit stores and renders the native message without converting it to a legacy SDK message shape

#### Scenario: Message status events
- **WHEN** SDK 5.0 emits message delivered, read, recalled, updated, pinned, or reaction events
- **THEN** the corresponding store updates use SDK 5.0 event payload fields

### Requirement: Legacy message API removed
The UIKit SHALL remove legacy message creation, send, and field usage from internal primary paths.

#### Scenario: Message cleanup check
- **WHEN** the migration cleanup check searches implementation files
- **THEN** it finds no internal primary-path usage of `chatSDK.message.create`, `client.send`, `message.chatType`, `message.msg`, `message.mid`, `customEvent`, or `customExts`
