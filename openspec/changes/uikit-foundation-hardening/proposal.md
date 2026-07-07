## Why

The architecture review identified several meaningful UIKit improvements, but the highest near-term return is not another large refactor. The current project still has weak points in type/build reliability, public API boundaries, provider configuration clarity, and developer onboarding, all of which directly affect adoption, upgrade safety, and AI-assisted use.

## What Changes

- Define a focused foundation-hardening change that tackles short-term improvements with clear user and maintenance value.
- Stabilize the library delivery baseline by requiring clean library type-checking and declaration generation, while isolating demo and Storybook errors from package builds.
- Clarify the public integration contract around `Provider`, supported provider-style data injection, and documented public entry points.
- Add a short list of validation surfaces and docs that make the UIKit easier to integrate correctly, especially for SDK 5 and AI-assisted development.
- Defer larger architectural upgrades such as fully slot-based page components, headless hooks expansion, SDK adapter extraction, and AI-native runtime features into later changes.

## Capabilities

### New Capabilities
- `uikit-foundation-governance`: Defines the short-term governance baseline for type safety, public API boundaries, provider contract clarity, and developer-facing validation/docs.

### Modified Capabilities
- None.

## Impact

- Affected areas include build/type-check configuration, package exports and public entry surfaces, `module/store/Provider.tsx`, `module/store/RootContext.ts`, related provider typing, and core docs/examples.
- This change is expected to drive follow-up implementation work in library build config, provider contract cleanup, docs, and lightweight validation coverage.
- No immediate redesign of page-level component composition, store architecture, or CallKit internals is required by this proposal.
