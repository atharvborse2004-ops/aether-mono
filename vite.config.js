import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages the app is served from https://<user>.github.io/<repo>/, so the
// asset base has to match the repo name. GITHUB_REPOSITORY is set by Actions;
// locally it is unset and the base stays '/'.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig({
  base: repo ? `/${repo}/` : '/',
  plugins: [react()],
  server: { port: 5174 },
})
