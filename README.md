# GCG Meta Vue

Vue 3 + Vite 8 frontend for Gundam Card Game meta analysis.

## Data

The app needs processed tier data to work. Run the full pipeline:

```bash
npm run data
```

This scrapes card data, tournament results, and builds tier/archetype files into `data-processed/`.

If you already have scraped data in `data/`, you can skip to building tiers:

```bash
npm run build:tiers
```
