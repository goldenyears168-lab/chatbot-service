import { defineConfig, globalIgnores } from 'eslint/config'

// Vite + React repo: keep ESLint minimal and compatible with the existing dependency set.
export default defineConfig([
  globalIgnores([
    'dist/**',
    '.next/**',
    '.vercel/**',
    'coverage/**',
    '_archive/**',
    'node_modules/**',
    'out/**',
    'build/**',
  ]),
])
