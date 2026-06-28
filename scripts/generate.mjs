import { mkdirSync } from 'node:fs'
import { build } from 'vite'

mkdirSync('data', { recursive: true })
mkdirSync('data-processed', { recursive: true })

await build({
  build: { write: false, emptyOutDir: false },
  logLevel: 'warn',
})
