import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      $data: fileURLToPath(new URL('./data-processed', import.meta.url)),
      $raw: fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        codeSplitting: true,
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue-router')) {
              return 'vendor-vue-router'
            }
            if (id.includes('apexcharts') || id.includes('vue3-apexcharts')) {
              return 'vendor-charts'
            }
            if (id.includes('@vueuse')) {
              return 'vendor-vueuse'
            }
            if (id.includes('vue')) {
              return 'vendor-vue'
            }
            return 'vendor'
          }
        },
      },
      onLog(level, log, defaultHandler) {
        if (log.code === 'INVALID_ANNOTATION') {
          return
        } else {
          defaultHandler(level, log)
        }
      },
    },
  },
  plugins: [
    AutoImport({
      imports: ['vue', 'vue-router'],
      dirs: ['./src/utils', './src/composables'],
      eslintrc: { enabled: true, filepath: './.dev/.eslintrc-auto-import.json' },
      vueTemplate: true,
      dts: './.dev/auto-imports.d.ts',
    }),
    Components({
      dts: './.dev/components.d.ts',
      directoryAsNamespace: true,
      collapseSamePrefixes: true,
    }),
    vue(),
    tailwindcss(),
  ],
})
