# PromptPad

Offline-first desktop notes app for prompt writing and organization.

## Prereqs

- Node.js 20 LTS
- pnpm
- Rust stable

## Install

```bash
pnpm install
```

## Run (Desktop)

```bash
pnpm prompt
```

If startup is blocked by stale dev processes/ports:

```bash
pnpm run prompt:hard-reset
```

Debug startup/watcher issues (opens devtools + verbose Tauri logs):

```bash
pnpm run prompt:debug
```

Run Tauri dev without the Rust file watcher (useful for File Provider noise):

```bash
pnpm run prompt:nowatch
```

## Run (Web only)

```bash
pnpm dev
```

## Dev On iCloud Desktop (macOS)

If this repo is inside iCloud Desktop, move `node_modules` out of the synced tree:

```bash
pnpm run dev:icloud-fix
pnpm install
```

For pnpm compatibility, this rewires `./node_modules/.pnpm` to
`~/Library/Caches/promptpad-dev/<project>/node_modules/.pnpm` via symlink,
which removes most dependency churn from the iCloud-managed tree.

## Verification

Fast local loop:

```bash
pnpm run verify:quick
```

Full gate:

```bash
pnpm run verify:full
```

Startup smoke:

```bash
pnpm run smoke:startup
```
