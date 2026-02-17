# Branch Plan

Keep branching simple and incremental.

## Main flow
1. `main` stays releasable.
2. Create short-lived feature branches from `main`.
3. Merge small PRs in dependency order.

## Suggested initial merge order
1. Scaffold and docs baseline
2. Theme tokens and base layout
3. SQLite layer + note CRUD commands
4. Editor integration and note persistence
5. Search + tags
6. Export formats
7. QA polish and cross-platform fixes
