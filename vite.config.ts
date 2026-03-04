import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Allow Google OAuth popup to communicate back to this window
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
