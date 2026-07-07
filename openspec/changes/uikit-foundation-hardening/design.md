## Context

The review conclusion is directionally clear: this UIKit should behave like an IM application framework, not just a bag of React components. But turning that conclusion into actionable work requires tighter scope. The codebase already has SDK 5 migration work in progress, a large shared `Provider` contract, direct `rootStore` exposure, mixed public/internal import patterns, and a build pipeline where package success does not yet guarantee clean type output.

Several larger improvements are desirable, including slot-based page composition, headless hooks, an SDK adapter layer, and AI-native conversation primitives. Those are legitimate, but they have wider design and migration impact. The first improvement wave should instead harden the foundation that every later change depends on:

- library type correctness and declaration output
- public API boundaries
- `Provider` capability grouping and provider-style integration contract
- docs/examples/validation that reduce accidental misuse

This scope also matches the current repository state. `Provider` already accepts `userInfoProvider`, while related capabilities such as group info and upload customization are split across other surfaces. `RootContext` and `ProviderProps` contain overlapping but not fully aligned capability declarations. This makes the public contract harder to reason about and weakens future evolution.

## Goals / Non-Goals

**Goals:**

- Establish a short-term implementation track with visible user benefit and contained migration risk.
- Make package builds trustworthy by separating library type guarantees from demo and Storybook noise.
- Define the public API boundary that consumers are expected to rely on.
- Normalize the `Provider` contract around clearly documented capability groups and provider-based data integration.
- Require a minimal set of docs/examples/validation so both humans and coding agents can integrate the UIKit correctly.

**Non-Goals:**

- Do not redesign all page-level components into slot APIs in this change.
- Do not add a full headless hooks product layer in this change.
- Do not extract a complete SDK adapter layer in this change.
- Do not introduce AI assistant runtime features in this change.
- Do not attempt a large root store encapsulation refactor while SDK 5 migration is still stabilizing.

## Decisions

### Focus the first wave on delivery reliability and integration clarity

This change prioritizes build correctness, contract clarity, and onboarding assets over deeper runtime restructuring.

Rationale: these items have immediate payoff for package consumers, reduce regression risk, and unblock later refactors. A consumer cannot safely adopt a component library whose type surface and public import boundaries are ambiguous.

Alternative considered: start with slot/headless architecture changes. Rejected for now because that would create broader API churn before the package surface is stable.

### Treat library type-checking and declaration generation as release gates

The library source, public entry files, and generated declarations must pass cleanly. Demo and Storybook issues may exist temporarily, but they must be isolated from the package release path.

Rationale: for a UI library, declaration quality is part of the product. This is also the most direct way to improve AI-generated usage accuracy because strong exported types are the primary machine-readable contract.

Alternative considered: keep the current mixed TS setup and only fix errors opportunistically. Rejected because it preserves false-green builds and makes every later change harder to validate.

### Define a narrow public API contract instead of exposing internal paths by convention

The project should document and enforce supported import surfaces through root/module/component entry points and package exports. Internal modules remain available for maintainers but are not part of the compatibility promise.

Rationale: today users can drift into internal imports or store details when the intended surface is not explicit. That makes upgrades harder and increases accidental breakage.

Alternative considered: postpone until a later API Extractor phase. Rejected because even without API Extractor, the repository can immediately define supported export paths and document them.

### Evolve `Provider` by grouping capability concerns, not by adding more flat fields

This change should establish the target direction that `Provider` separates:

- SDK/runtime config
- feature flags
- external data providers
- theme/locale
- callbacks or public events

The first implementation wave may be backward-compatible and incremental, but the spec should require a documented grouping model and migration path.

Rationale: `Provider` is the runtime boundary and the primary integration point. If its contract keeps growing without structure, every feature addition becomes harder to explain and validate.

Alternative considered: leave `Provider` shape untouched and rely on docs only. Rejected because the structural problem is already visible in types and context definitions.

### Require AI-friendly docs and examples as part of the foundation

The foundation baseline includes concise docs and copyable examples for the supported integration path, plus machine-friendly reference assets such as `AGENTS.md` upkeep and optional `llms.txt` style indexing.

Rationale: the review correctly identifies that AI usability is mostly a function of stable types, explicit contracts, and examples. That work belongs in the foundation, not as an afterthought.

Alternative considered: treat AI-friendliness as a future marketing concern. Rejected because it directly affects developer success today.

## Risks / Trade-offs

- [Scope expands from governance into refactor] -> Mitigation: keep this change limited to baseline contracts, validation, and docs; capture larger API restructures as follow-up changes.
- [Public API tightening exposes existing consumer dependence on internals] -> Mitigation: make the first step documentation plus supported exports, then phase enforcement with compatibility notes.
- [Provider contract cleanup collides with SDK 5 migration work] -> Mitigation: prefer additive or compatibility-preserving changes in the first pass and coordinate with `sdk5-upgrade`.
- [Type/build cleanup uncovers many old issues] -> Mitigation: explicitly separate library tsconfig/build gates from demo/story validation instead of attempting a full repo cleanup at once.

## Migration Plan

1. Define the supported foundation baseline in spec and tasks.
2. Implement library-focused build/type gates first so later tasks have a trustworthy validation path.
3. Normalize `Provider` and public export surfaces with compatibility-preserving changes where possible.
4. Add docs/examples and lightweight validation coverage that exercise the intended integration path.
5. Capture follow-up changes for slot APIs, headless hooks, SDK adapter extraction, and AI-native features.

Rollback strategy: each implementation step should be independently revertible. Build config, export boundaries, and docs can be rolled back without data migration. Provider contract changes should remain backward-compatible during the first implementation wave to avoid forced rollback pressure.

## Open Questions

- Should `groupInfoProvider` and file upload customization be normalized into the core `Provider` contract now, or staged behind compatibility aliases first?
- Should public API boundary enforcement in the first pass rely only on `package.json` exports, or also introduce an API report/check step?
- Is `llms.txt` required in this first wave, or is it sufficient to treat it as a recommended deliverable if docs bandwidth is limited?
