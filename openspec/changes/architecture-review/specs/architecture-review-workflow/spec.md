## ADDED Requirements

### Requirement: Review produces classified findings
The architecture review SHALL classify every actionable finding by implementation timing.

#### Scenario: Finding blocks SDK 5
- **WHEN** a finding is required for SDK 5.0 correctness or would otherwise force immediate rework during SDK migration
- **THEN** it is classified as `Blocker for SDK5`

#### Scenario: Finding is valuable but not blocking
- **WHEN** a finding improves architecture but SDK 5.0 can be completed safely without it
- **THEN** it is classified as `Do after SDK5`

#### Scenario: Finding is optional cleanup
- **WHEN** a finding is minor polish, style cleanup, or low-impact simplification
- **THEN** it is classified as `Nice to have`

### Requirement: Review findings include evidence
The architecture review SHALL include concrete evidence for each finding.

#### Scenario: Finding is recorded
- **WHEN** a finding is added to the review output
- **THEN** it includes affected files or modules, the observed issue, impact, recommendation, and timing classification

### Requirement: SDK5 blockers feed into SDK5 upgrade
The architecture review SHALL feed SDK 5.0 blockers into the `sdk5-upgrade` change.

#### Scenario: Blocker is found
- **WHEN** a finding is classified as `Blocker for SDK5`
- **THEN** the review records where it should be reflected in `sdk5-upgrade` proposal, design, specs, or tasks

### Requirement: Non-blocking improvements remain separate
The architecture review SHALL NOT add non-blocking implementation work to the `sdk5-upgrade` task list.

#### Scenario: Future refactor is found
- **WHEN** a finding is classified as `Do after SDK5` or `Nice to have`
- **THEN** it is recorded as a future change candidate rather than added to `sdk5-upgrade`

### Requirement: Review output is actionable
The architecture review SHALL produce an actionable review document before any follow-up architecture implementation begins.

#### Scenario: Review completes
- **WHEN** the review phase is complete
- **THEN** the output includes findings grouped by timing category, open questions, and recommended follow-up OpenSpec changes
