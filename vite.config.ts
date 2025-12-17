import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const enableApiProxy = process.env.VITE_API_PROXY === 'true' || env.VITE_API_PROXY === 'true'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Keep existing imports like "@/lib/..." and "@/components/..."
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: enableApiProxy
      ? {
          // If you run `wrangler pages dev` on 8788, Vite can proxy API requests to it.
          proxy: {
            '/api': {
              target: 'http://127.0.0.1:8788',
              changeOrigin: true,
            },
          },
        }
      : undefined,
  }
})


