import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'NeoCalcu - Calculadora Neonatal',
        short_name: 'NeoCalcu',
        description: 'Calculadora médica bedside para neonatología',
        theme_color: '#1e3a8a',
        background_color: '#f0f4ff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: []
      }
    })
  ],
  resolve: {
    alias: { '@': '/src' }
  }
});
