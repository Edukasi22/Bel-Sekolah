import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Plugin guard to ensure server.ws is safely defined when HMR is disabled in AI Studio preview
function safeWsGuard(): Plugin {
  return {
    name: 'safe-ws-guard',
    configureServer(server) {
      if (!server.ws) {
        server.ws = {
          send: () => {},
          on: () => {},
          off: () => {},
          close: () => {},
          clients: new Set(),
        } as unknown as typeof server.ws;
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      safeWsGuard(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
