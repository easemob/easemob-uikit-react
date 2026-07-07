## Context

The current codebase already contains useful message helper functions in `module/utils/message.ts`, but the adapter boundary is incomplete. Conversation components still inspect `lastMessage`, `from`, `type`, and thread metadata directly. Thread-related code still carries local compatibility logic inline. This leads to repeated field fallback logic and makes the effective data model harder to enforce.

The goal of this change is not to hide the SDK completely in one pass. That would be too large and risky. Instead, this change starts a dedicated adapter layer that makes read access consistent for the most reused entities:

- message
- conversation
- thread / chatThreadOverview

This should give later changes one stable place to extend compatibility rules and reduce future component-level drift.

## Goals / Non-Goals

**Goals:**

- Create explicit adapter helpers for normalized conversation and thread reads alongside the existing message helpers.
- Move a first set of UI/store reads onto adapter functions where the benefit is immediate and risk is low.
- Preserve current behavior while reducing direct field probing in components.
- Establish an incremental migration path for more modules to adopt the adapter layer.

**Non-Goals:**

- Do not fully rewrite stores around a new domain model in this change.
- Do not convert every message component in one pass.
- Do not change public component props purely for adapter purity.
- Do not move SDK network operations into the adapter layer in this first wave.

## Decisions

### Build the adapter inside `module/utils` first

The first implementation wave will extend the existing utility-based compatibility layer instead of creating a large new top-level package.

Rationale: the repo already treats `module/utils/message.ts` as the place for SDK 5 compatibility helpers. Extending that pattern reduces churn and keeps migration incremental.

Alternative considered: create a brand-new `module/sdkAdapter/` subtree immediately. Rejected for now because the value comes first from normalized reads, not directory ceremony.

### Separate message, conversation, and thread adapter concerns

Message helpers stay in `message.ts`; new conversation and thread-specific helpers will live beside them and expose normalized getters.

Rationale: these entities have different compatibility needs and should not collapse into one catch-all file.

Alternative considered: one giant adapter module. Rejected because it would become another mixed-ownership utility bag.

### Migrate high-traffic read paths first

The first code migration should target places like `ConversationItem`, `ConversationStore`, and `ThreadStore`, where repeated direct field access is common and user-visible behavior depends on consistent interpretation.

Rationale: these locations provide immediate leverage without touching the full message rendering surface.

Alternative considered: start with all message renderers. Rejected because that is broader and more regression-prone.

## Risks / Trade-offs

- [Adapter helpers remain partial and two patterns coexist] -> Mitigation: document the adapter contract in spec/tasks and move the most reused reads first.
- [Behavior drifts if helpers normalize differently from current component expectations] -> Mitigation: keep adapters conservative and preserve existing fallback order when migrating.
- [Utilities become a dumping ground] -> Mitigation: separate conversation/thread helpers into dedicated files and keep function purposes narrow.

## Migration Plan

1. Define the adapter capability and task plan.
2. Add normalized conversation and thread helper modules.
3. Switch selected store/component read paths to adapter helpers.
4. Validate library type-checking and focused foundation smoke tests.
5. Continue migrating remaining modules in follow-up commits on the same branch.

Rollback strategy: adapter migrations are local and revertible by file. If a migrated component regresses, the affected helper usage can be rolled back without undoing the whole adapter layer.

## Open Questions

- Should normalized conversation helpers eventually own snippet derivation for all message types, or remain thin field readers only?
- When later message components migrate, should `BaseMessageType` be narrowed further, or kept as a compatibility umbrella?
