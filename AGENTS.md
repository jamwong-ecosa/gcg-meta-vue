# gcg-vue

## CRITICAL RULES — READ BEFORE WRITING ANY CODE

**NEVER add explicit imports for auto-imported APIs:**
- `vue` APIs (`ref`, `computed`, `watch`, `onMounted`, etc.)
- `vue-router` APIs (`useRouter`, `useRoute`, etc.)
- Components in `src/components/` (use namespaced name: `UiDarkToggle`, `ChartDistributionBars`, etc.)
- Exports from `src/utils/` and `src/composables/`
- `tw` template tag from `src/utils/tw.js`

**ONLY add explicit imports for:**
- `@vueuse/core` (NOT auto-imported)
- npm packages
- `$data/*` path aliases

**Component naming:** Use the namespaced name from the component folder structure (e.g. `TierMobileTierCard`, `CardMetaCardItem`, `ChartDistributionBars`). The plugin auto-imports by folder name + filename with duplicate prefix collapsing.

Vue 3 + Vite 8 + Tailwind CSS 4 frontend.

## Prerequisites

```bash
source ~/.nvm/nvm.sh && nvm use
```

## Commands

| Command                     | What it does                                                               |
| --------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`               | Vite dev server                                                            |
| `npm run build`             | Vite production build → `dist/`                                            |
| `npm run preview`           | Preview production build                                                   |
| `npm run lint`              | ESLint (flat config: `eslint.config.js`)                                   |
| `npm run lint:fix`          | ESLint auto-fix + Prettier format                                          |
| `npm run format`            | Prettier (`.prettierrc` + `prettier-plugin-tailwindcss`)                   |
| `npm run format:check`      | Prettier check-only                                                        |
| `npm run data`              | Full pipeline: scrape products → scrape cards → scrape tournaments → build tiers |
| `npm run scrape:products`   | Scrape product data from `gundam-gcg.com` (→ `data/products.json`)         |
| `npm run scrape:cards`      | Scrape card database from `gundam-gcg.com` (→ `data/cards.json`)           |
| `npm run scrape:tournament` | Scrape tournament results (→ `data/tournaments-all.json`)                  |
| `npm run build:tiers`       | Rebuild tier data from existing scraped data → `data-processed/tiers.json` |

## Project structure

- `src/App.vue` — root component with dark mode toggle
- `src/main.js` — mount point
- `src/style.css` — Tailwind v4 entry + `@custom-variant dark`
- `src/composables/useDarkMode.js` — VueUse `useDark()` wrapper
- `src/components/` — auto-imported components grouped by feature:
  - `archetype/` — archetype detail, dropdown, modal, timeline, quadrant charts
  - `card/` — card display, meta card sections, top cards, newcomers
  - `chart/` — distribution charts, quadrant charts, pie chart
  - `tier/` — tier table, mobile tier card
  - `ui/` — shared UI: dropdowns, modals, tabs, headers, collapsible, popover, dark toggle
- `scripts/` — data pipeline scripts (scrapers, tier builder)
- `data/` — generated raw scraped data (gitignored)
- `data-processed/` — generated tier & archetype data (gitignored)
- `index.html` — FOUC prevention via inline `<script>`

## Style conventions

- ESM (`"type": "module"`), single quotes, no semicolons
- Tailwind classes auto-sorted by `prettier-plugin-tailwindcss`
- Match existing conventions in neighboring files
- Prefer Tailwind utility classes over custom CSS classes; only create a custom class when a pattern cannot be expressed with utilities alone
- Whenever Tailwind classes appear outside a `class` attribute (e.g. `exact-active-class`, `active-class`, transition props), wrap them with `tw`` tagged template literal (auto-imported from `src/utils/tw.js`)
- Vue and vue-router APIs are auto-imported (`ref`, `computed`, `useRouter`, `useRoute`, etc.) — no explicit import needed
- `curly: ['error', 'all']` — all `if`/`for`/`while` bodies use braces and are multi-line; ESLint `--fix` handles this automatically

## Dark mode

- Toggles `.dark` class on `<html>` via VueUse's `useDark()`
- `@custom-variant dark (&:where(.dark, .dark *))` in `src/style.css`
- localStorage key `dark-mode` — inline `<script>` in `index.html` prevents FOUC
- Use `dark:` utilities everywhere (e.g. `dark:bg-gray-900`)

## Data pipeline

`npm run data` runs the full pipeline:

1. `scrape:products` — fetches product data from GCG website (→ `data/products.json`)
2. `scrape:cards` — fetches all card data (name, color, type) from GCG website (→ `data/cards.json`)
3. `scrape:tournament` — fetches tournament events, players, and deck lists (uses local cache, skips already-fetched events) (→ `data/tournaments-all.json`)
4. `build:tiers` — groups decks by color-combo archetype, computes scores and tier thresholds (ckmeans clustering) (→ `data-processed/tiers.json`)

You must run `npm run data` (or at minimum `npm run build:tiers`) after cloning to generate `data-processed/tiers.json`. The app will not work without this file.

## User preferences

- `@vueuse/core` APIs (e.g. `onKeyStroke`, `useDark`) are NOT auto-imported — always add explicit `import { ... } from '@vueuse/core'`
- Components are auto-imported from `src/components/` with `directoryAsNamespace: true` and `collapseSamePrefixes: true` — use the namespaced name in templates (e.g. `UiDarkToggle`, `CardMetaCardItem`, `ChartDistributionBars`)
- When modifying a modal component, keep changes in the modal file itself rather than in child components like ArchetypeDetail

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
