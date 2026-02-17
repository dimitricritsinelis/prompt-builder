# QA Checklist

Manual smoke checks before release candidate builds.

## Core note flow
- Create a note
- Edit title and body
- Save and reopen app; content persists
- Delete a note and confirm removal

## Search and tags
- Search by title text
- Search by body text
- Add/remove tags
- Filter notes by tag

## Editor and blocks
- Add structured blocks
- Remove structured blocks
- Confirm freeform editing still works
- Paste plain text into editor

## Export
- Export markdown and verify readable structure
- Export JSON and verify schema fields
- Export provider text and verify section order

## UI
- Theme toggle works
- Keyboard shortcuts work
- Spacing and typography match tokens
- Motion remains subtle (around 200ms ease)

## Platform pass
- macOS smoke pass
- Windows smoke pass
