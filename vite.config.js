import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devApi } from './vite-dev-api'

export default defineConfig({
  // devApi() only attaches in `vite dev`; it is a no-op in the production build.
  plugins: [react(), devApi()],
})
