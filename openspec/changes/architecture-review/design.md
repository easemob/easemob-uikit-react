## Context

The current UIKit has grown around SDK 4.x assumptions: global singleton store state, direct SDK client access in many modules, message components coupled to old message fields, stores that mix SDK calls with UI state updates, and CallKit signaling embedded in a large service. SDK 5.0 migration will already require broad changes, but architecture review needs a separate track to avoid uncontrolled scope growth.

## Goals / Non-Goals

**Goals:**

- Review existing architecture and implementation before or during SDK 5.0 work.
- Identify design issues that are mandatory for SDK 5.0 migration.
- Identify improvements that should be deferred into separate future changes.
- Produce actionable findings with owner areas, impact, and recommended timing.

**Non-Goals:**

- Do not implement refactors in this change.
- Do not expand `sdk5-upgrade` with non-blocking cleanup.
- Do not redesign the public component API unless a finding proves it is required for SDK 5.0 correctness.
- Do not rewrite UI styling, docs, or demos as part of review.

## Decisions

### Findings use three timing categories

Each finding will be classified as:

- `Blocker for SDK5`: must be addressed inside `sdk5-upgrade` because SDK 5.0 cannot work correctly without it.
- `Do after SDK5`: valuable but should be implemented after the SDK migration reaches a stable baseline.
- `Nice to have`: low-risk cleanup or polish that should not drive current scope.

Rationale: this keeps the SDK migration focused while still capturing useful architecture improvements.

### Findings must include evidence

Each finding must cite concrete files, behavior, or coupling patterns. Vague cleanup suggestions are not enough.

Rationale: the review should produce engineering decisions that can be implemented or explicitly deferred.

### Follow-up implementation requires a separate change

Non-blocking architecture improvements should become separate OpenSpec changes with their own proposal, design, specs, and tasks.

Rationale: this keeps review separate from implementation and preserves testable acceptance boundaries.

## Risks / Trade-offs

- Review may discover large refactor opportunities -> mitigate by classifying them as future changes unless they block SDK 5.
- Review may slow SDK 5 work -> mitigate by time-boxing review areas and focusing first on files touched by SDK 5 migration.
- Some issues may be ambiguous -> mitigate by recording open questions rather than forcing premature redesign.

## Review Areas

- Runtime and Provider lifecycle.
- RootStore and MobX store boundaries.
- SDK event handling and public `eventHandler`.
- Message data model and message component responsibilities.
- Conversation state and unread/read semantics.
- Address book, user info, group, and presence data ownership.
- Chatroom and thread ownership boundaries.
- CallKit service design and IM/RTC separation.
- Public export surface and type naming.
- Demo, story, and test coverage as validation surfaces.
