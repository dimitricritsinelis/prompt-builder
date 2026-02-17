# Editor + Prompt Blocks

Editor foundation:
- TipTap StarterKit
- Placeholder (per-node-type)
- Typography
- CodeBlock
- Link
- TaskList + TaskItem
- Underline

## Prompt blocks (custom node)

Node type: `promptBlock`

JSON shape:
```json
{
  "type": "promptBlock",
  "attrs": { "blockType": "role", "collapsed": false },
  "content": [
    { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }
  ]
}
```

## Block types

- role (label: ROLE)
- context (label: CONTEXT)
- task (label: TASK)
- constraints (label: CONSTRAINTS)
- examples (label: EXAMPLES)
- format (label: OUTPUT FORMAT)

## Visual spec

- left border: 3px solid accent (per type)
- background: var(--bg-block)
- radius: 8px
- padding: 16px content; label bar 8px 12px
- margin: 12px vertical between blocks
- collapse: show label + first ~60 chars preview
- drag handle: reorder blocks within editor
- rich text inside the block

## Block insertion

- Slash menu: typing `/` at empty line start opens filtered dropdown
- Toolbar: “Insert Block” dropdown

## Prompt note template

Creating a prompt note should insert all six blocks in order, empty with placeholders.
Freeform notes start blank.
