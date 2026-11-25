import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/no-v-html': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Pages and components get data from src/services (api.* or catalog),
    // never from mock files, so connecting the API never means editing a page.
    files: ['src/**/*.{js,vue}'],
    ignores: ['src/services/**', 'src/data/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/data/mock/*', '@/data/mock/*'],
              message: 'Import data through @/services/api (async) or @/services/catalog.js (static lookups) instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
]
