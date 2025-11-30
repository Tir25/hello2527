import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    build: {
        // Optimize build performance
        target: 'esnext',
        minify: 'esbuild', // Use esbuild for faster minification
        sourcemap: false, // Disable sourcemaps in production for faster builds
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor chunks for better caching
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'supabase-vendor': ['@supabase/supabase-js'],
                    'ui-vendor': ['framer-motion', 'lucide-react'],
                },
            },
        },
    },
    optimizeDeps: {
        // Pre-bundle dependencies for faster dev server startup
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@supabase/supabase-js',
            'socket.io-client',
        ],
    },
})
