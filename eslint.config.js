import autoImportGlobals from './.eslintrc-auto-import.json' with { type: 'json' }
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...autoImportGlobals.globals,
      },
    },
  },
  {
    rules: {
      curly: ['error', 'all'],
    },
  },
  eslintConfigPrettier,
]
