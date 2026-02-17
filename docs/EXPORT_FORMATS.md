# Export formats

## Markdown

- Title as H1
- Each prompt block becomes an H2 section in canonical order
- Non-block freeform content remains as paragraphs between sections

Example:
```md
# My Prompt

## Role
You are a senior data scientist...

## Context
Given a dataset...
```

## JSON (lossless envelope)

Example:
```json
{
  "promptpad_version": "1.0",
  "exported_at": "2026-02-16T12:00:00Z",
  "note": {
    "id": "uuid",
    "title": "My Prompt",
    "note_type": "prompt",
    "body_json": {},
    "created_at": "...",
    "updated_at": "..."
  }
}
```

## Provider formatted

### Claude (XML tags)
```xml
<role>...</role>
<context>...</context>
<task>...</task>
<constraints>...</constraints>
<examples>...</examples>
<output_format>...</output_format>
```

### GPT/OpenAI (Markdown delimiters)
```md
### Role
...
### Context
...
```

## Bulk export

- Markdown folder: one file per note, slugified filenames
- JSON archive: single file containing all notes in the lossless envelope format
