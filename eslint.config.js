import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import tailwindcss from 'eslint-plugin-tailwindcss'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules', '*.config.js', '*.config.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
      tailwindcss,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: true,
        node: true,
      },
      tailwindcss: {
        cssConfigPath: 'src/styles/index.css',
      },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...tailwindcss.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'import/no-unresolved': 'off',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          whitelist: [
            'glass',
            'glass-border',
            'glass-inner-glow',
            'transition-spring',
            'transition-reveal',
            'transition-apply',
            'shimmer-text',
            'text-balance',
            'tabular-nums',
            'haptic-tap',
            'skeleton',
            'live-backdrop',
            'view-transition',
            't-badge',
            't-badge-dot',
            't-digit-group',
            't-digit-slot',
            't-digit',
            't-digit-old',
            't-icon',
            't-icon-swap',
            't-success-check',
            't-input',
            't-input-wrap',
            't-error-msg',
            't-tabs',
            't-tab',
            't-tabs-pill',
            't-shimmer',
            't-like',
            't-like-icon',
            't-like-heart',
            't-like-particles',
            't-text-swap',
            't-subtle-number',
            't-subtle-slot',
            't-subtle-new',
            't-subtle-old',
            't-stagger',
            't-stagger-line',
            't-skel',
            't-skel-skeleton',
            't-skel-content',
            'hide-scrollbar',
            'is-error',
            'is-shaking',
            'is-animating',
            'is-shown',
            'is-hiding',
            'is-pulsing',
            'is-revealed',
            'is-resetting',
            'is-bursting',
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
)
