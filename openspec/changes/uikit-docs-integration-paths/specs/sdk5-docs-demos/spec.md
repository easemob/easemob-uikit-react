## ADDED Requirements

### Requirement: User-facing SDK 5 migration guide
Project documentation SHALL provide a user-facing SDK 5 migration guide that is distinct from internal OpenSpec migration notes.

#### Scenario: Field and API mapping
- **WHEN** a developer migrates an existing UIKit integration from legacy SDK 4.x or early SDK 5 field usage
- **THEN** the guide documents message/conversation field mappings, token-only login, manager APIs, and removed password login

#### Scenario: Unread and read-receipt migration
- **WHEN** a developer migrates unread clear or message read receipt logic
- **THEN** the guide documents `clearConversationUnreadMessageCount`, `sendMessageReadReceipts`, `onMessageReadReceipts`, `sendStatus`, `isPeerRead`, and `groupReadCount`

#### Scenario: Discoverable from quick start
- **WHEN** a developer opens the foundation quick start or README migration links
- **THEN** they can reach the user-facing SDK 5 migration guide in one navigation step
