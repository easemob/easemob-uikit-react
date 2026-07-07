## ADDED Requirements

### Requirement: Library build outputs SHALL be trustworthy
The UIKit project SHALL provide a library-focused validation path in which package source type-checking and declaration generation complete without unresolved errors.

#### Scenario: Package release validation runs
- **WHEN** maintainers run the library validation or build flow for the package
- **THEN** the library source and exported type declarations complete without hidden TypeScript or declaration-generation errors

#### Scenario: Demo or Storybook code has unrelated issues
- **WHEN** demo or Storybook-only code contains type issues that do not affect the published package
- **THEN** those issues are isolated from the library release validation path instead of causing false confidence about package correctness

### Requirement: Public import surfaces SHALL be explicit
The UIKit project SHALL define and document the supported public import surfaces that consumers may rely on for compatibility.

#### Scenario: Consumer imports UIKit APIs
- **WHEN** a consumer integrates the package
- **THEN** the supported entry points for components, modules, hooks, and types are documented and exported through intended public surfaces instead of requiring internal path imports

#### Scenario: Internal modules are needed by maintainers
- **WHEN** maintainers work inside the repository
- **THEN** internal module organization may remain implementation detail without extending the public compatibility promise to those paths

### Requirement: Provider capability boundaries SHALL be documented and normalized
The UIKit project SHALL define a documented `Provider` contract that separates runtime SDK configuration, feature flags, external data providers, presentation settings, and callbacks/events.

#### Scenario: Consumer configures application runtime
- **WHEN** a consumer reads or uses the `Provider` API
- **THEN** the configuration model makes it clear which options belong to SDK/runtime setup, feature enablement, external data integration, and presentation concerns

#### Scenario: Consumer needs business-owned display data
- **WHEN** a consumer supplies user info, group info, or similar business-owned data sources
- **THEN** the integration path uses documented provider-style interfaces instead of requiring direct `rootStore` manipulation

### Requirement: Short-path integration docs SHALL exist
The UIKit project SHALL provide concise, copyable guidance for the highest-value integration paths identified by the review.

#### Scenario: Developer starts a new UIKit integration
- **WHEN** a developer follows the primary getting-started path
- **THEN** they can reach a minimal working IM application with the documented `Provider` contract and supported public APIs

#### Scenario: Developer customizes core business data
- **WHEN** a developer needs to customize user info, group info, custom message rendering, or SDK 5 data usage
- **THEN** the repository provides direct documentation or examples for those scenarios instead of only scattered API references

### Requirement: Foundation improvements SHALL include machine-friendly validation assets
The UIKit project SHALL include a minimal set of machine-friendly assets that improve AI-assisted contribution and verification.

#### Scenario: Coding agent or automation inspects the repository
- **WHEN** an agent needs repository guidance
- **THEN** it can rely on maintained project instructions, public API/type signals, and reproducible validation entry points to generate or verify changes

#### Scenario: Core integration path is updated
- **WHEN** maintainers change the intended integration path
- **THEN** the corresponding guidance and validation assets are updated together so automated workflows do not drift from supported usage
