## Why

The SDK 5.0 migration will touch the most important runtime, store, and UI paths in the UIKit. This creates a good opportunity to review current design issues, but mixing broad architecture cleanup into the SDK upgrade would make scope, testing, and regressions hard to control.

## What Changes

- Add a structured architecture review workflow for the current UIKit implementation.
- Classify findings into `Blocker for SDK5`, `Do after SDK5`, and `Nice to have`.
- Feed only SDK 5.0 blockers back into the existing `sdk5-upgrade` change.
- Capture non-blocking architecture improvements as separate future OpenSpec changes.
- No production code changes are required by this change unless a finding is explicitly promoted to another implementation change.

## Capabilities

### New Capabilities

- `architecture-review-workflow`: A review process for assessing existing architecture, implementation quality, and refactor opportunities without expanding the SDK 5.0 migration scope.

### Modified Capabilities

- None. This repository has no archived base OpenSpec specs yet.

## Impact

- Affected areas for review include Provider/runtime wiring, stores, hooks, SDK event handling, message model, conversation state, address book, chatroom, thread, CallKit, component layering, exported APIs, demos, docs, and tests.
- Output will be review documentation and follow-up recommendations, not immediate production code changes.
- Findings that are required for SDK 5.0 correctness will be copied or referenced into `openspec/changes/sdk5-upgrade`.
