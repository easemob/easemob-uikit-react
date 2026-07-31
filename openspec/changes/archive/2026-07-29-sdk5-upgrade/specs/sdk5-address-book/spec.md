## ADDED Requirements

### Requirement: Native SDK 5.0 contacts
The UIKit SHALL manage contacts and blocklist through SDK 5.0 ContactManager.

#### Scenario: Load contacts
- **WHEN** the contacts module loads contacts after login
- **THEN** it reads contacts from SDK 5.0 `contactManager.getContacts`

#### Scenario: Mutate contact
- **WHEN** the user adds, deletes, accepts, rejects, or updates a contact remark
- **THEN** the UIKit calls the corresponding SDK 5.0 ContactManager API

#### Scenario: Manage blocklist
- **WHEN** the blocklist is loaded or changed
- **THEN** the UIKit uses SDK 5.0 ContactManager blocklist APIs

### Requirement: Native SDK 5.0 user info
The UIKit SHALL fetch and update user profile data through SDK 5.0 UserInfoManager.

#### Scenario: Load user profile
- **WHEN** a module requires user profile data
- **THEN** it calls SDK 5.0 `userInfoManager.getUserInfoByUserId` or another appropriate UserInfoManager API

### Requirement: Native SDK 5.0 presence
The UIKit SHALL publish, subscribe, query, and render online presence using SDK 5.0 PresenceManager.

#### Scenario: Subscribe presence
- **WHEN** a list needs presence for visible users
- **THEN** the UIKit uses SDK 5.0 `presenceManager.subscribePresence` or `presenceManager.getPresenceStatus`

#### Scenario: Presence event update
- **WHEN** SDK 5.0 emits a presence event
- **THEN** the UIKit updates address-book state and presence UI from SDK 5.0 presence payloads

### Requirement: Native SDK 5.0 groups
The UIKit SHALL manage group lists, group details, group members, member attributes, and group events through SDK 5.0 GroupManager.

#### Scenario: Load joined groups
- **WHEN** group data is needed after login
- **THEN** the UIKit calls SDK 5.0 `groupManager.getJoinedGroupList`

#### Scenario: Load group members
- **WHEN** a group member list is opened
- **THEN** the UIKit calls SDK 5.0 group member APIs through GroupManager or a `Group` instance

#### Scenario: Group event update
- **WHEN** SDK 5.0 emits group events such as members joined, members exited, admin changed, owner changed, or member attributes changed
- **THEN** the UIKit updates group state from the SDK 5.0 event payload
