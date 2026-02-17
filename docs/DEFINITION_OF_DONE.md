# Definition Of Done

A change is done only when all of the following are true:

1. Product behavior matches `docs/PRODUCT_SPEC.md` for the affected scope.
2. Visual implementation follows `docs/UI_TOKENS.md`.
3. Data integrity rules in `docs/DB_SCHEMA.md` are preserved.
4. Required tests are added/updated and passing.
5. `pnpm lint`, `pnpm test`, and `pnpm build` pass.
6. Rust checks pass for touched backend code (`cargo fmt`, `clippy`, `test`).
7. QA smoke checks in `docs/QA_CHECKLIST.md` are completed for relevant flows.
