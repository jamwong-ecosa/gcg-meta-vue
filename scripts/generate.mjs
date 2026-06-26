import { build } from 'vite'

await build({
  build: { write: false, emptyOutDir: false },
  logLevel: 'warn',
})
