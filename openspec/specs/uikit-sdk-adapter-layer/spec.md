# uikit-sdk-adapter-layer Specification

## Purpose
Provide a normalized internal adapter layer for UIKit message, conversation, and thread reads so modules and stores can rely on stable helper APIs instead of duplicating mixed SDK and legacy field access.
## Requirements
### Requirement: UIKit SHALL provide normalized conversation read helpers
The UIKit SHALL provide adapter helpers for reading conversation identifiers, names, pinned state, unread count, and last-message-derived display data without requiring components to directly probe mixed SDK and legacy fields.

#### Scenario: Conversation UI reads display data
- **WHEN** a conversation component renders title, time, unread, or message preview information
- **THEN** it can obtain normalized values through adapter helpers instead of duplicating field fallback logic inline

### Requirement: UIKit SHALL provide normalized thread read helpers
The UIKit SHALL provide adapter helpers for reading thread identifiers and thread overview metadata from mixed SDK-backed and UIKit-local thread shapes.

#### Scenario: Thread-capable message UI renders thread state
- **WHEN** a module needs the thread id, name, last message, or reply count from a thread overview object
- **THEN** it can read those values through adapter helpers that preserve current fallback behavior

### Requirement: Initial adapter migration SHALL preserve current public behavior
The first adapter implementation wave SHALL keep existing UIKit user-facing behavior compatible while changing internal read paths.

#### Scenario: Existing conversation and thread UI is rendered after migration
- **WHEN** the adapter helpers replace direct field access in selected modules
- **THEN** the rendered titles, snippets, timestamps, unread indicators, and thread entry behavior remain functionally equivalent for current supported data shapes

### Requirement: Adapter adoption SHALL be incremental
The UIKit SHALL allow modules to migrate onto adapter helpers incrementally instead of requiring a full repository rewrite in one change.

#### Scenario: Only a subset of modules is migrated
- **WHEN** selected components and stores adopt adapter helpers first
- **THEN** the remaining modules continue working and can migrate in follow-up commits without breaking the new adapter contract
