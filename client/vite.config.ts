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
        // Proxy Supabase requests to fix cookie domain issues
        // This routes all Supabase requests through the dev server,
        // making them appear to come from localhost and preventing
        // the __cf_bm cookie domain mismatch error
        proxy: {
            '/supabase': {
                target: 'https://ckuxuusctkmuwmeqnwxw.supabase.co',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/supabase/, ''),
                secure: true,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.error('Proxy error:', err)
                    })
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        // Preserve original host header for proper routing
                        if (req.headers.host) {
                            proxyReq.setHeader('host', 'ckuxuusctkmuwmeqnwxw.supabase.co')
                        }
                    })
                },
            },
        },
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
        // Copy public directory files to dist
        copyPublicDir: true,
    },
    publicDir: 'public',
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
