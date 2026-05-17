# Audiobook Admin — Design System

Reference: care-console style admin (light sidebar, neutral palette, card-based content).

## Principles

- **Calm and operational** — high readability, generous whitespace, subtle borders.
- **Hierarchy** — sidebar for navigation; main area for page title, actions, then data.
- **Consistency** — use theme tokens only (`bg-sidebar`, `text-muted-foreground`, etc.), not raw hex in components.

## Color tokens (Tailwind v4 `@theme`)

| Token | Usage |
|--------|--------|
| `background` | App shell behind sidebar |
| `sidebar` | Left navigation panel |
| `sidebar-foreground` | Nav labels |
| `sidebar-accent` | Active nav item background |
| `card` | Panels, tables, modals |
| `border` | Dividers, inputs, table lines |
| `foreground` | Primary text |
| `muted-foreground` | Secondary text, placeholders |
| `primary` | Primary buttons (dark / black) |
| `primary-foreground` | Text on primary buttons |
| `accent` | Login/marketing accent (orange) |

## Typography

| Role | Class |
|------|--------|
| Brand title | `font-display text-2xl font-semibold tracking-tight` |
| Brand subtitle | `text-[10px] uppercase tracking-[0.2em] text-muted-foreground` |
| Page title | `text-2xl font-semibold tracking-tight` |
| Page subtitle | `text-sm text-muted-foreground` |
| Section label | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |
| Table header | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |

**Fonts:** `font-sans` — Inter, system UI. `font-display` — Georgia, serif (logo only).

## Layout

- **Sidebar width:** `16rem` (`w-64`), fixed, full height.
- **Main:** `flex-1`, `bg-background`, `p-6`–`p-8`.
- **Content max width:** none (full bleed tables/cards).

## Components

### Sidebar nav item

- Default: `text-muted-foreground`, icon + label, `rounded-lg`, `px-3 py-2`.
- Active: `bg-sidebar-accent text-foreground font-medium`.

### Cards / stat tiles

- `rounded-xl border border-border bg-card p-5 shadow-sm`.

### Primary button

- `bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium`.

### Search input

- `h-10 rounded-lg border border-border bg-card pl-10 text-sm`.

### Data table

- Header row on `bg-muted/40`, body rows `border-b border-border`.

## Icons

Use **lucide-react** only. Default size `h-4 w-4`; nav `h-[18px] w-[18px]`.

## Charts

- Bar chart: `primary` fill at 85% opacity, rounded tops, light grid lines.
