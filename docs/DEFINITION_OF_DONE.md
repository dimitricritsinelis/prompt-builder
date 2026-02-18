# Definition of Done (per PR)

A PR is “done” when:
- It matches `docs/PRODUCT_SPEC.md` and does not regress UI tokens
- Desktop app builds and runs via `pnpm prompt`
- Automated checks pass:
  - frontend lint + tests (if present)
  - rust fmt/clippy/tests (if present)
- No network calls added
- DB/editor integrity preserved (no data loss edge cases introduced)
- Any spec deviations are documented (update docs or add PR notes)
