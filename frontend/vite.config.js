import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'preserve-laravel-front-controller',
      closeBundle() {
        writeFileSync(
          resolve(__dirname, '../public/index.php'),
          `<?php\n\nif (!str_starts_with((string) ($_SERVER['REQUEST_URI'] ?? ''), '/api')) {\n    readfile(__DIR__.'/index.html');\n    exit;\n}\n\nrequire __DIR__.'/../backend/public/index.php';\n`,
        )
      },
    },
  ],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
})
