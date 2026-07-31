# Integration Docs Wave Notes

## 1.1 Existing doc audit (reuse vs rewrite)

| Doc | Decision |
|-----|----------|
| `docs/zh/foundation-quickstart.md` | Reuse as shortest path; link out to modes / migration / FAQ |
| `docs/zh/provider.md` | Reuse for Provider API details; business-data doc links here |
| `docs/zh/userInfo.md` | Reuse for avatar/nickname details; linked from business-data |
| `docs/zh/quick_start.md` | Keep legacy page; README prefers foundation-quickstart + integration-modes |
| `docs/zh/troubleshooting.md` | Keep runtime/build errors; cross-link FAQ for product scenarios |
| `docs/zh/store.md` | Reuse temporarily; public/internal Store contract deferred to `uikit-public-store-api` |
| `README.md` | Update reference links to new entry docs |
| `llms.txt` | Expand index to new docs |

## 1.2 Chinese file map

- `docs/zh/integration-modes.md` — three integration modes + examples
- `docs/zh/sdk5-migration.md` — user-facing SDK 5 migration
- `docs/zh/business-data.md` — userInfo/groupInfo/custom message/upload gaps
- `docs/zh/faq.md` — scenario FAQ
- Index updates: `foundation-quickstart.md`, `README.md`, `llms.txt`, `AGENTS.md`, `troubleshooting.md`

## 1.3 English coverage for this wave

**Decision:** Chinese-first. English gets stub entry pages that point to the Chinese guides and summarize the recommended path in English. Full bilingual parity is deferred.

## 6.3 Follow-up change candidate

Capture next: **`uikit-public-store-api`**

- Document supported public Store / hook actions
- Mark internal store surfaces
- Tighten Provider contract for upload (`providers.fileUpload` or equivalent) after current gap callouts in `docs/zh/business-data.md`
