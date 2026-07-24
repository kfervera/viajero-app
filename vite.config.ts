import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  base: '/viajero-app/',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Viajero',
        short_name: 'Viajero',
        description: 'Itinerario de viajes compartido',
        lang: 'es',
        display: 'standalone',
        background_color: '#f5f5f4',
        theme_color: '#f5f5f4',
        // Íconos (192/512/maskable) se agregan en la Fase 8, ver PLAN.md.
        icons: [],
      },
      workbox: {
        // Solo assets estáticos del build; los datos de Supabase se cachean
        // aparte en IndexedDB (ver PLAN.md §4.2 y §5), no acá.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
