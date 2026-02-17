# UI Tokens

These tokens are the source of truth for theming. Implement them as CSS custom properties.

## Color tokens (Light / Dark)

(Implement exactly; see also `src/styles/theme.css` once created.)

Light:
- bg-primary: #F5F4EF (warm parchment)
- bg-surface: #FFFFFF
- bg-surface-hover: #FAF9F6
- bg-sidebar: #EEEDEA
- bg-block: #F9F8F5

- text-primary: #1C1B18
- text-secondary: #6B6860
- text-tertiary: #9C9890

- accent: #BF5B3A
- accent-hover: #A84E30
- accent-subtle: #BF5B3A15

- border-default: rgba(0,0,0,0.08)
- border-strong: rgba(0,0,0,0.15)

- shadow-sm: 0 1px 2px rgba(0,0,0,0.04)
- shadow-md: 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)
- shadow-lg: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)

Dark:
- bg-primary: #1A1917
- bg-surface: #242320
- bg-surface-hover: #2A2926
- bg-sidebar: #1E1D1A
- bg-block: #2A2926

- text-primary: #E8E6E0
- text-secondary: #9C9890
- text-tertiary: #6B6860

- accent: #D4714E
- accent-hover: #E07E58
- accent-subtle: #D4714E18

- border-default: rgba(255,255,255,0.06)
- border-strong: rgba(255,255,255,0.12)

- shadow-sm: 0 1px 2px rgba(0,0,0,0.2)
- shadow-md: 0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)
- shadow-lg: 0 4px 16px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2)

## Typography

- Body font: 'Source Serif 4', Georgia, Cambria, serif
- UI font: system-ui (SF/Segoe)
- Mono font: SF Mono / Cascadia Code / JetBrains Mono / Fira Code

Sizing:
- body: 16px, line-height 1.65
- ui: 13px
- mono: 14px
- label: 11px uppercase, weight 600, tracking 0.04em

## Spacing / layout

- base unit: 4px
- radius:
  - cards: 10px
  - buttons: 6px
  - blocks: 8px
  - inputs: 6px

Layout:
- sidebar: 260px fixed
- editor max width: 720px
- editor padding: 48px horizontal, 40px top

## Motion

- transitions: 200ms ease
- sidebar collapse: 250ms ease-in-out
- no bouncy/spring animations
