# PromptPad UI Tokens

These tokens are the source of truth for visual styling.
Implement them as CSS variables in `src/styles/theme.css`.

## Design direction
- Calm, notebook-like, low-noise interface
- Comfortable spacing
- Strong readability
- Subtle motion only

## Color tokens
```css
:root {
  --bg: #f6f7f9;
  --surface: #ffffff;
  --surface-muted: #f0f2f5;
  --border: #dde2ea;
  --text: #111827;
  --text-muted: #4b5563;
  --accent: #0f766e;
  --accent-strong: #0b5e57;
  --danger: #b91c1c;
  --focus-ring: rgba(15, 118, 110, 0.35);
}
```

## Typography tokens
```css
:root {
  --font-sans: "SF Pro Text", "Segoe UI", sans-serif;
  --font-mono: "SF Mono", "Cascadia Code", monospace;
  --fs-12: 0.75rem;
  --fs-14: 0.875rem;
  --fs-16: 1rem;
  --fs-18: 1.125rem;
  --fs-24: 1.5rem;
  --lh-tight: 1.25;
  --lh-normal: 1.5;
  --lh-relaxed: 1.65;
}
```

## Spacing and shape tokens
```css
:root {
  --space-4: 0.25rem;
  --space-8: 0.5rem;
  --space-12: 0.75rem;
  --space-16: 1rem;
  --space-20: 1.25rem;
  --space-24: 1.5rem;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 8px 24px rgba(16, 24, 40, 0.08);
}
```

## Motion tokens
```css
:root {
  --motion-duration: 200ms;
  --motion-ease: ease;
}
```

## Usage rules
- Do not introduce one-off colors without adding a token.
- Keep contrast accessible and readable in light and dark themes.
- Reuse spacing and radius values; avoid arbitrary pixel values.
