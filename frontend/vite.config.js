import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'preserve-laravel-front-controller',
      writeBundle() {
        writeFileSync(
          resolve(__dirname, '../public/index.php'),
          `<?php\n\nif (!str_starts_with((string) ($_SERVER['REQUEST_URI'] ?? ''), '/api')) {\n    readfile(__DIR__.'/index.html');\n    exit;\n}\n\nrequire __DIR__.'/../backend/public/index.php';\n`,
        )
        copyFileSync(resolve(__dirname, 'dist/index.html'), resolve(__dirname, 'dist/404.html'))
      },
    },
  ],
    build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
