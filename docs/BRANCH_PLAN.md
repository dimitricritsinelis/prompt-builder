# Branch plan (semi-simple)

Base branch:
- `main` is always green and shippable.

Feature branches (merge in this order):
1) `feat/foundation-ui`
2) `feat/storage`
3) `feat/editor-core`
4) `feat/prompt-blocks`
5) `feat/export-polish`
6) `ci/github-actions` (can merge anytime once stable)

Rules:
- Merge only after checks pass (see `docs/DEFINITION_OF_DONE.md`)
- Prefer small PRs aligned to prompt steps (1 prompt ≈ 1 PR)
