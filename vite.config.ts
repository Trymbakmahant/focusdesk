import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/link': path.resolve(__dirname, './src/shims/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, './src/shims/next-navigation.ts'),
      'next/headers': path.resolve(__dirname, './src/shims/next-headers.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  },
  define: {
    // Shims for process.env in browser Vite build
    'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kvtsypmhjyvkofncdzzf.supabase.co'),
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dHN5cG1oanl2a29mbmNkenpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MzI2ODYsImV4cCI6MjEwNTEwODY4Nn0.heIDw05o9rgyC59iE1_sjPsuJ1PrC_ODjdUyFfCyMa4'),
    'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_05Sr6LhKsRISHzOFL7aWKg_u6dEVBJS'),
  },
});
