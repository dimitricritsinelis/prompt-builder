# Export Formats

PromptPad supports deterministic local export formats.

## 1) Markdown export
Filename: `<note-title>.md`

Format:
- `# <Title>`
- Optional metadata (created/updated/tags)
- Body content as markdown
- Optional structured sections in fixed order:
  - Role
  - Context
  - Task
  - Constraints
  - Examples
  - Output Format

## 2) JSON export
Filename: `<note-title>.json`

Shape:
```json
{
  "id": "string",
  "title": "string",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "tags": ["string"],
  "bodyJson": {},
  "bodyText": "string",
  "blocks": {
    "role": "string",
    "context": "string",
    "task": "string",
    "constraints": "string",
    "examples": "string",
    "outputFormat": "string"
  }
}
```

## 3) Provider text export
Filename: `<note-title>.<provider>.txt`

Rules:
- Deterministic section ordering.
- Omit empty sections.
- Keep plain text without markdown syntax unless explicitly chosen.
- Designed for direct paste into provider chat UIs.
