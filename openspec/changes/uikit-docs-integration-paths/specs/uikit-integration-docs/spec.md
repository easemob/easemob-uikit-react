## ADDED Requirements

### Requirement: Three integration path docs
The documentation SHALL describe three supported integration modes for UIKit consumers: full-page composition, hooks/store composition, and pure UI components.

#### Scenario: Full-page mode
- **WHEN** a developer wants the fastest path to a working IM UI
- **THEN** docs provide a minimal example using `Provider`, `ConversationList`, and `Chat` with the recommended `providers` contract

#### Scenario: Hooks or store composition mode
- **WHEN** a developer already has custom pages and only needs IM data/behavior
- **THEN** docs explain how to compose exported hooks/context/store actions without importing internal module paths

#### Scenario: Pure UI mode
- **WHEN** a developer wants to render IM visuals with their own data wiring
- **THEN** docs show how to use exported UI/module presentational pieces and state the current limits of headless coverage

### Requirement: Business data integration docs
The documentation SHALL explain how to inject business-owned display and extension data through the supported Provider contract and documented customization points.

#### Scenario: User and group display data
- **WHEN** a developer needs avatars and nicknames from their business backend
- **THEN** docs show `providers.userInfo` and `providers.groupInfo` usage and note the deprecated `userInfoProvider` alias

#### Scenario: Custom messages
- **WHEN** a developer needs to send or render custom message types
- **THEN** docs provide a copyable SDK 5-native example using `body.event` / `body.params` and the relevant render override

#### Scenario: Upload and permission gaps
- **WHEN** a developer looks for file upload or permission/moderation integration
- **THEN** docs state what is currently supported, what remains unsupported or undocumented, and which follow-up change owns the gap

### Requirement: Scenario FAQ
The documentation SHALL include a scenario FAQ covering common integration failures observed after SDK 5 adoption.

#### Scenario: Avatar inconsistency
- **WHEN** conversation list shows an avatar but message sender does not
- **THEN** FAQ explains the userInfo resolution path difference and how to fix it via providers/sync settings

#### Scenario: Empty contacts or sync failure
- **WHEN** contacts are empty or sync appears stuck
- **THEN** FAQ explains `enableSyncData`, login/connection prerequisites, and how to inspect sync completion

#### Scenario: Unread returns after re-login
- **WHEN** unread badges clear after opening a conversation but return after re-login
- **THEN** FAQ explains optimistic local clear vs `clearConversationUnreadMessageCount` server/SDK persistence and how to diagnose failures

### Requirement: AI-friendly doc index
Project machine-readable guidance SHALL index the new integration docs so AI coding agents can discover the recommended path.

#### Scenario: llms.txt points to integration docs
- **WHEN** an AI agent reads `llms.txt`
- **THEN** it finds links to the three integration modes, SDK 5 migration guide, business data guide, and FAQ
