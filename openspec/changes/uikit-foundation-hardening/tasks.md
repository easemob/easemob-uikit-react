## 1. Validation Baseline

- [x] 1.1 Audit the current TypeScript and `vite-plugin-dts` failure points for library source, demos, and Storybook separately.
- [x] 1.2 Split or refine tsconfig/build validation so library source and declaration generation can pass independently of demo and Storybook-only issues.
- [x] 1.3 Add or update a documented command path for release-grade library validation.

## 2. Public API Boundary

- [x] 2.1 Inventory current public exports across `index.ts`, `module/index.ts`, and `component/entry.ts`, and identify internal-only surfaces currently exposed by convention.
- [x] 2.2 Define the supported public import surfaces in package metadata and/or repository docs.
- [x] 2.3 Align exported types and entry points with the supported public API contract, keeping compatibility impact explicit.

## 3. Provider Contract Hardening

- [x] 3.1 Review `ProviderProps` and `RootContext` for mismatched or mixed concerns across SDK config, features, providers, theme, and locale.
- [x] 3.2 Introduce a normalized provider-oriented configuration model for business-owned data sources, starting with the highest-value existing capabilities.
- [x] 3.3 Preserve or document backward-compatible migration behavior for existing `Provider` consumers.

## 4. Docs And Developer Guidance

- [x] 4.1 Add or revise a short-path quickstart focused on the supported `Provider` contract and public entry points.
- [x] 4.2 Add focused guidance or examples for user info provider, group info/provider-style business data, custom message rendering, and SDK 5 data model expectations.
- [x] 4.3 Add or refresh machine-friendly repository guidance assets needed for AI-assisted development, keeping them aligned with the supported integration path.

## 5. Validation Surface

- [x] 5.1 Define one or more lightweight verification targets that exercise the primary integration path, such as focused Vitest coverage or a core demo smoke flow.
- [x] 5.2 Document which validations are required before closing follow-up implementation tasks under this change.
- [x] 5.3 Capture follow-up OpenSpec changes for deferred work including slot APIs, headless hooks, SDK adapter extraction, and AI-native features.

## Deferred Follow-up Changes

- [x] D1 Capture `uikit-slot-api` as a follow-up candidate for page-level slot customization.
- [x] D2 Capture `uikit-headless-hooks` as a follow-up candidate for business composition APIs.
- [x] D3 Capture `uikit-sdk-adapter` as a follow-up candidate for SDK normalization and event ownership.
- [x] D4 Capture `uikit-ai-native` as a follow-up candidate for assistant conversation, streaming, and tool-call UI.
