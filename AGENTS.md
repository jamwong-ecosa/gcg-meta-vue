# gcg-vue

Vue 3 + Vite 8 + Tailwind CSS 4 frontend.

## Prerequisites

```bash
source ~/.nvm/nvm.sh && nvm use 24
```

## Commands

| Command                     | What it does                                                         |
| --------------------------- | -------------------------------------------------------------------- |
| `npm run dev`               | Vite dev server                                                      |
| `npm run build`             | Vite production build → `dist/`                                      |
| `npm run preview`           | Preview production build                                             |
| `npm run lint`              | ESLint (flat config: `eslint.config.js`)                             |
| `npm run lint:fix`          | ESLint auto-fix                                                      |
| `npm run format`            | Prettier (`.prettierrc` + `prettier-plugin-tailwindcss`)             |
| `npm run format:check`      | Prettier check-only                                                  |
| `npm run data`              | Full pipeline: scrape cards → scrape tournaments → build tiers       |
| `npm run scrape:cards`      | Scrape card database from `gundam-gcg.com` (→ `data/cards.json`)     |
| `npm run scrape:tournament` | Scrape tournament results (→ `data/tournaments-all.json`)            |
| `npm run build:tiers`       | Rebuild tier data from existing scraped data → `src/data/tiers.json` |

## Project structure

- `src/App.vue` — root component with dark mode toggle
- `src/main.js` — mount point
- `src/style.css` — Tailwind v4 entry + `@custom-variant dark`
- `src/composables/useDarkMode.js` — VueUse `useDark()` wrapper
- `src/components/` — currently empty
- `scripts/` — data pipeline scripts (scrapers, tier builder)
- `data/` — generated raw scraped data (gitignored)
- `index.html` — FOUC prevention via inline `<script>`

## Style conventions

- ESM (`"type": "module"`), single quotes, no semicolons
- Tailwind classes auto-sorted by `prettier-plugin-tailwindcss`
- Match existing conventions in neighboring files
- Prefer Tailwind utility classes over custom CSS classes; only create a custom class when a pattern cannot be expressed with utilities alone
- Whenever Tailwind classes appear outside a `class` attribute (e.g. `exact-active-class`, `active-class`, transition props), wrap them with `tw`` tagged template literal (auto-imported from `src/utils/tw.js`)

## Dark mode

- Toggles `.dark` class on `<html>` via VueUse's `useDark()`
- `@custom-variant dark (&:where(.dark, .dark *))` in `src/style.css`
- localStorage key `dark-mode` — inline `<script>` in `index.html` prevents FOUC
- Use `dark:` utilities everywhere (e.g. `dark:bg-gray-900`)

## Data pipeline

`npm run data` runs the full pipeline:

1. `scrape:cards` — fetches all card data (name, color, type) from GCG website
2. `scrape:tournament` — fetches tournament events, players, and deck lists (uses local cache, skips already-fetched events)
3. `build:tiers` — groups decks by color-combo archetype, computes scores and tier thresholds (ckmeans clustering), outputs `src/data/tiers.json`

You must run `npm run data` (or at minimum `npm run build:tiers`) after cloning to generate `src/data/tiers.json`. The app will not work without this file.
