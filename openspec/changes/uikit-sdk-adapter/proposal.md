## Why

The UIKit already has partial SDK 5 helper functions, but SDK-native fields, legacy-compatible fields, and UI-local shapes are still mixed across modules. That makes message, conversation, and thread behavior harder to reason about, and increases the chance that future work reintroduces ad hoc field access or SDK-specific coupling in random components.

## What Changes

- Introduce an explicit UIKit SDK adapter layer for normalized message, conversation, and thread reads.
- Keep the first implementation wave scoped to read-path normalization, not a full runtime rewrite.
- Route selected high-traffic UI and store code through adapter helpers instead of direct field peeking.
- Define follow-up migration tasks so more modules can move onto adapter helpers incrementally.

## Capabilities

### New Capabilities
- `uikit-sdk-adapter-layer`: Defines a normalized adapter contract for reading SDK-backed message, conversation, and thread data in UIKit modules and stores.

### Modified Capabilities
- None.

## Impact

- Affected areas include `module/utils/`, conversation rendering, thread state handling, and any store/component code that currently mixes SDK 5 fields with fallback legacy shapes.
- This change should reduce repeated compatibility logic and make later SDK-facing refactors more local.
- No breaking public API rename is required in the first wave; the adapter layer is an internal architecture boundary with public behavior preserved.
