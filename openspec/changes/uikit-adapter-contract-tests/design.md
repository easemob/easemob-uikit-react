## Context

The repo now has a clearer internal adapter layer for message, conversation, and thread reads, plus a more explicit `ConversationSyncService` behavior boundary. Those areas are exactly where future SDK-shape work, store refactors, and UI cleanup will tend to land. Right now the validation stack is still heavily weighted toward type checking and a few component smoke tests, which means adapter fallback drift can slip through without detection.

The immediate need is not a full test architecture rewrite. It is a narrow, durable set of contract tests around the internal surfaces that now act as compatibility boundaries.

## Goals / Non-Goals

**Goals:**
- Add focused Vitest coverage for normalized adapter helpers under `module/utils/`.
- Add focused tests for `ConversationSyncService` behavior using lightweight store/client fakes.
- Lock down the preview-derivation behavior introduced by the new message preview helper.
- Keep the suite fast and low-maintenance so it can run in normal validation flows later.

**Non-Goals:**
- Do not add Playwright or full demo-flow tests in this change.
- Do not snapshot every message component or every page-level module.
- Do not redesign the runtime store shape just to make tests easier.
- Do not attempt to formalize the full long-term test pyramid in one pass.

## Decisions

### Add colocated Vitest tests near the adapter and sync modules

Test files should live close to the code they protect, following existing repo patterns where practical.

Rationale: these contracts are internal and module-scoped. Keeping tests close to the helpers and sync service reduces ambiguity and makes maintenance easier when those files change.

Alternative considered: add one central adapter test directory. Rejected because it weakens local ownership and makes the contract layer harder to discover from the implementation.

### Test helpers as behavior contracts, not implementation details

Tests should focus on observable results such as normalized ids, fallback order, preview text, unread increments, and `@mention` effects.

Rationale: this keeps the tests stable across internal refactors while still protecting the real compatibility contract.

Alternative considered: assert internal call order and temporary local variables. Rejected because it would overfit the current implementation and create brittle tests.

### Use lightweight hand-written fakes for store-driven sync tests

`ConversationSyncService` tests should stub only the store methods and data needed for the scenarios under test.

Rationale: the service logic is small, and lightweight fakes are easier to reason about than booting a full provider/store runtime.

Alternative considered: instantiate the full root store and mock broad SDK state. Rejected because it increases setup cost and obscures the behavior being validated.

## Risks / Trade-offs

- [Tests mirror current fallback behavior that may later need deliberate change] -> Mitigation: treat these as contract tests and update them only when the intended compatibility contract changes.
- [Lightweight fakes may miss integration issues] -> Mitigation: keep scope explicitly at the contract layer and add broader integration coverage in later test waves.
- [Preview helper assertions may duplicate translation-key semantics] -> Mitigation: assert the output pattern from a simple deterministic translation stub instead of relying on full i18n setup.

## Migration Plan

1. Add adapter helper contract tests for message, conversation, and thread normalization helpers.
2. Add `ConversationSyncService` tests covering new conversation creation, unread changes, and `@mention` state logic.
3. Run focused validation and keep the suite ready to expand in later changes.

Rollback is straightforward: the tests can be removed without changing runtime behavior if they prove too noisy, though that would reopen the regression gap this change is meant to close.

## Open Questions

- Should a later wave promote these adapter contract tests into a dedicated `validate:adapter` script?
- Which next shared boundary should receive similar tests after this wave: pinned/replied message logic, provider normalization, or SDK event handling?
