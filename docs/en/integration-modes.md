# Integration Modes

Chinese guide (complete): [docs/zh/integration-modes.md](../zh/integration-modes.md)

This wave documents three supported integration modes:

1. **Full-page** — `Provider` + `ConversationList` + `Chat`
2. **Hooks / store composition** — exported hooks and documented store actions
3. **Pure UI** — presentational components with your own wiring

Use only public import surfaces (`easemob-chat-uikit`, `/module`, `/component`, `/style.css`). Do not import internal paths like `module/store/*`.

For SDK 5 migration, business data, and FAQ, start from the Chinese docs linked in `llms.txt` until English parity is completed.
