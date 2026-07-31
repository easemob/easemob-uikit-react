## ADDED Requirements

### Requirement: CallKit uses SDK 5.0 IM signaling
CallKit SHALL send and receive IM signaling messages through SDK 5.0 ChatManager and native message payloads.

#### Scenario: Start call
- **WHEN** CallKit starts an audio or video call
- **THEN** it creates and sends the invite signaling message through SDK 5.0 ChatManager

#### Scenario: Respond to call
- **WHEN** CallKit accepts, rejects, cancels, times out, or hangs up a call
- **THEN** it sends the corresponding signaling message through SDK 5.0 ChatManager

### Requirement: CallKit uses SDK 5.0 RTC token APIs
CallKit SHALL use SDK 5.0 RTC helper APIs where RTC token or RTC UID mapping is required.

#### Scenario: Fetch RTC token
- **WHEN** CallKit needs an RTC token for a channel
- **THEN** it calls the SDK 5.0 RTC token API and uses the returned RTC app ID, token, channel name, UID, and expiry

### Requirement: CallKit removes legacy WebIM dependency
CallKit SHALL NOT import or call legacy `WebIM.message.create` or legacy connection send APIs.

#### Scenario: CallKit cleanup check
- **WHEN** the migration cleanup check searches CallKit implementation files
- **THEN** it finds no `WebIM.message.create` or `connection.send` usage
