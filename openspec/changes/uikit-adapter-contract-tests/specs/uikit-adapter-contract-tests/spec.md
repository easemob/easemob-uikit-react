## ADDED Requirements

### Requirement: UIKit SHALL provide contract tests for normalized adapter helpers
The UIKit SHALL verify normalized message, conversation, and thread helper behavior through automated contract tests so future refactors do not silently change fallback order or preview derivation.

#### Scenario: Adapter helper fallback behavior is verified
- **WHEN** adapter helper tests run against mixed SDK-native and legacy-compatible shapes
- **THEN** the tests assert stable identifiers, names, unread counts, pinned state, thread metadata, and preview text results for the supported fallback order

### Requirement: UIKit SHALL provide contract tests for conversation sync behavior
The UIKit SHALL verify the high-value behavior of `ConversationSyncService` through automated tests covering conversation creation, unread updates, and `@mention` state handling.

#### Scenario: Message sync updates conversation state
- **WHEN** `ConversationSyncService` processes supported incoming messages under different current-conversation conditions
- **THEN** the tests assert whether a conversation is created, topped, unread counts change, and `@mention` state is set or skipped according to current behavior

### Requirement: Contract tests SHALL stay focused on reusable internal boundaries
The first contract-test wave SHALL stay focused on reusable adapter and sync boundaries instead of attempting to cover all message rendering surfaces or end-to-end UIKit workflows in one change.

#### Scenario: Test scope is limited to adapter and sync contracts
- **WHEN** the first adapter contract-test suite is introduced
- **THEN** it covers reusable helper and sync behavior with lightweight fakes, while broader UI snapshots and end-to-end workflows remain follow-up work
