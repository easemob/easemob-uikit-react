# SDK 5 Migration Guide

Chinese guide (complete): [docs/zh/sdk5-migration.md](../zh/sdk5-migration.md)

Key points:

- Token login only; password login is unsupported
- Prefer SDK 5 fields: `msgLocalId`, `msgServerId`, `conversationId`, `conversationType`, `timestamp`, `body.*`
- Split send/read state: `sendStatus`, `isPeerRead`, `groupReadCount`
- Clear unread with `clearConversationUnreadMessageCount` (does not notify the peer)
- Message read receipts with `sendMessageReadReceipts` / `onMessageReadReceipts`
