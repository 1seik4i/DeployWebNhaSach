import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const deployment = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
  const apiRewrite = deployment.rewrites.find((rewrite: { source: string }) => rewrite.source === '/api/(.*)');
  // Vercel's SPA rewrite cannot serve WebSocket upgrades; connect directly to the backend.
  const productionWsUrl = new URL('/ws', apiRewrite.destination).href.replace(/^http/, 'ws');
  return {
    define: {
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || (mode === 'production' && !/^https?:/.test(env.VITE_API_BASE_URL || '') ? productionWsUrl : '')),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: { include: ['react-router-dom', 'qrcode.react'] },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://127.0.0.1:4000',
          ws: true,
        },
      },
    },
  };
})
