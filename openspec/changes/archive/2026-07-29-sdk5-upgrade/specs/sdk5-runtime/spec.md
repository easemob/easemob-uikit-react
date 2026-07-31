## ADDED Requirements

### Requirement: SDK 5.0 runtime initialization
The UIKit SHALL initialize Easemob Web SDK through SDK 5.0 `ChatClient.init` and SHALL register all managers required by exported UIKit features.

#### Scenario: Provider initializes ChatClient
- **WHEN** an application renders `Provider` with a valid `initConfig.appKey`
- **THEN** the UIKit initializes one SDK 5.0 `ChatClient` instance with Chat, Contact, Group, ChatRoom, Presence, Push, UserInfo, and ChatThread managers

#### Scenario: Root context exposes SDK 5 runtime
- **WHEN** a UIKit child component reads `RootContext`
- **THEN** it receives the SDK 5.0 client and manager-backed capabilities rather than a legacy SDK connection instance

### Requirement: Token login only
The UIKit SHALL log in through SDK 5.0 token login and SHALL NOT attempt legacy password login.

#### Scenario: Token login succeeds
- **WHEN** `Provider` receives `initConfig.userId` and `initConfig.token`
- **THEN** it calls SDK 5.0 login with `{ userId, token }` and updates login state on connection success

#### Scenario: Password login is not used
- **WHEN** `Provider` receives only `initConfig.userId` and `initConfig.password`
- **THEN** it does not call any password-login SDK API and surfaces the unsupported configuration through type deprecation, documentation, or runtime error handling

### Requirement: Current user access uses SDK 5.0
The UIKit SHALL use SDK 5.0 current-user access for all self-user checks.

#### Scenario: Component checks current user
- **WHEN** a component needs to determine whether an entity belongs to the current user
- **THEN** it uses `client.getCurrentUserId()` or a helper backed by `getCurrentUserId()`

### Requirement: Legacy SDK runtime API removed
The UIKit SHALL remove legacy SDK runtime API usage from implementation code.

#### Scenario: Runtime cleanup check
- **WHEN** the migration cleanup check searches implementation files
- **THEN** it finds no internal primary-path usage of `new SDK.connection`, `.open(`, `client.user`, or `client.context.userId`
