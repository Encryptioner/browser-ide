import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { copyFileSync, existsSync } from 'fs';

// Plugin to copy coi-serviceworker to dist
function copyCoiServiceWorker() {
  return {
    name: 'copy-coi-serviceworker',
    writeBundle() {
      const sourcePath = 'node_modules/coi-serviceworker/coi-serviceworker.min.js';
      const targetPath = 'dist/coi-serviceworker.min.js';
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, targetPath);
        console.log('✅ Copied coi-serviceworker.min.js to dist/');
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  plugins: [
    react(),
    copyCoiServiceWorker(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'robots.txt'],
      manifest: {
        name: 'Browser IDE',
        short_name: 'Browser IDE',
        description: 'Production-ready VS Code-like IDE in the browser with multi-LLM support',
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
        display: 'standalone',
        orientation: 'any',
        scope: '/browser-ide/',
        start_url: '/browser-ide/',
        icons: [
          {
            src: '/browser-ide/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        categories: ['development', 'productivity', 'utilities'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      // Disable PWA for GitHub Pages (conflicts with coi-serviceworker)
      disable: true,
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: './', // Use relative path for local testing
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for testing
        drop_debugger: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['@monaco-editor/react'],
          terminal: ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links'],
          git: ['isomorphic-git', '@isomorphic-git/lightning-fs'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          state: ['zustand', 'dexie', 'dexie-react-hooks'],
          utils: ['date-fns', 'nanoid', 'clsx'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    exclude: ['@webcontainer/api'],
    include: ['react', 'react-dom', 'zustand', 'dexie', 'dexie-react-hooks'],
  },
  // IMPORTANT: NO COOP/COEP headers - simulates GitHub Pages environment
  // This allows testing coi-serviceworker functionality locally
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // NO HEADERS - simulating GitHub Pages
    hmr: {
      overlay: true,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    // NO HEADERS - simulating GitHub Pages
  },
}));
