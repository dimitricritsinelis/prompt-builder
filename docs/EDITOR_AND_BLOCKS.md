# Editor And Prompt Blocks

TipTap drives note editing. Structured prompt blocks are optional enhancements.

## Core behavior
- Users can always write freeform text.
- Structured blocks can be added/removed without data loss.
- Block fields map to sections commonly used for prompt engineering.

## Structured blocks
- Role
- Context
- Task
- Constraints
- Examples
- Output Format

## Storage contract
- Entire editor document is stored as `body_json`.
- Derived text for indexing/export fallback is stored as `body_text`.
- Block metadata must survive round-trip serialize/deserialize.

## UX requirements
- Block controls stay lightweight and non-intrusive.
- Keyboard-first editing remains smooth.
- Pasting plain text should not require block conversion.

## Parsing/formatting rules
- Keep deterministic ordering for structured sections in exports.
- Preserve original user text as much as possible.
- Avoid lossy transforms during save/load cycles.

## Testing focus
- Round-trip editor JSON parse/serialize
- Block insertion/removal behavior
- Export formatting with and without blocks
