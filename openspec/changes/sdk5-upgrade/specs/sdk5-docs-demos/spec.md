## ADDED Requirements

### Requirement: SDK 5.0 documentation
Project documentation SHALL describe SDK 5.0 initialization, login, message model, and manager APIs.

#### Scenario: Quick start docs
- **WHEN** a developer follows the README or docs quick start
- **THEN** the example uses SDK 5.0 token login and `Provider` configuration compatible with SDK 5.0

#### Scenario: Migration docs
- **WHEN** a developer reads the SDK 5.0 migration guidance
- **THEN** the docs explain removed password login, native message fields, manager APIs, and breaking callback payload changes

### Requirement: SDK 5.0 demos and stories
Demos and Storybook stories SHALL use SDK 5.0 native message and conversation mock data.

#### Scenario: Demo message mock
- **WHEN** a demo or story renders a message without a live SDK connection
- **THEN** the mock message uses SDK 5.0 fields such as `body`, `conversationId`, `conversationType`, `msgLocalId`, `msgServerId`, and `timestamp`

### Requirement: Agent guidance updated
The project agent guidance SHALL reflect that the UIKit uses SDK 5.0 native APIs and data models.

#### Scenario: AI agent reads guidance
- **WHEN** an AI agent reads project guidance before implementing a feature
- **THEN** it is instructed to use SDK 5.0 managers and native fields rather than legacy SDK APIs
