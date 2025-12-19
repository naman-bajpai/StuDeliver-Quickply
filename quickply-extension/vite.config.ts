import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync } from 'fs';
import esbuild from 'esbuild';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // Copy manifest.json and auth.html from public to dist
        try {
          copyFileSync(
            resolve(__dirname, 'public/manifest.json'),
            resolve(__dirname, 'dist/manifest.json')
          );
          copyFileSync(
            resolve(__dirname, 'public/auth.html'),
            resolve(__dirname, 'dist/auth.html')
          );
        } catch (error) {
          console.error('Error copying files:', error);
        }
      },
    },
    {
      name: 'rebuild-extension-scripts',
      async closeBundle() {
        // Rebuild background.js and content.js as self-contained IIFE bundles
        // This is required because Chrome extensions need service workers and content scripts
        // to be in IIFE format, not ES modules
        const scripts = [
          { entry: 'src/background.ts', output: 'dist/background.js' },
          { entry: 'src/content.ts', output: 'dist/content.js' },
        ];
        
        for (const script of scripts) {
          try {
            // Get environment variables from process.env (Vite's env vars)
            const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
            const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
            
            await esbuild.build({
              entryPoints: [resolve(__dirname, script.entry)],
              bundle: true,
              outfile: resolve(__dirname, script.output),
              format: 'iife',
              platform: 'browser',
              target: 'es2020',
              minify: false,
              sourcemap: false,
              external: [], // Bundle everything including node_modules
              define: {
                'process.env.NODE_ENV': '"production"',
                'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
                'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
              },
              tsconfig: resolve(__dirname, 'tsconfig.json'),
            });
            console.log(`✓ Rebuilt ${script.output} as self-contained IIFE`);
          } catch (error) {
            console.error(`✗ Error rebuilding ${script.output}:`, error);
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        options: resolve(__dirname, 'options.html'),
        // Don't include background and content in the main Vite build
        // They'll be rebuilt as IIFE by the plugin above
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        format: 'es', // ES modules for popup/options (React needs this)
      },
    },
    // Ensure all dependencies are bundled
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
