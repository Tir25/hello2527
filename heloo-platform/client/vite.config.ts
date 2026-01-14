import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            // Polyfills for simple-peer Node.js dependencies
            // These prevent browser compatibility warnings
            stream: 'readable-stream',
            buffer: 'buffer',
            // Stub util module to silence simple-peer warnings about util.debuglog/util.inspect
            util: 'util/',
        },
    },
    define: {
        global: 'globalThis',
        'process.env': {},
    },
    server: {
        port: 3000,
        host: '0.0.0.0', // Listen on all network interfaces for mobile testing
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
                        proxyReq.setHeader('host', 'ckuxuusctkmuwmeqnwxw.supabase.co')

                        // FIX: Forward Accept header to prevent 406 (Not Acceptable) errors
                        // PostgREST requires proper Accept header for content negotiation
                        if (req.headers.accept) {
                            proxyReq.setHeader('Accept', req.headers.accept)
                        } else {
                            // Default to JSON if not specified
                            proxyReq.setHeader('Accept', 'application/json')
                        }

                        // Forward Content-Type for POST/PATCH requests
                        if (req.headers['content-type']) {
                            proxyReq.setHeader('Content-Type', req.headers['content-type'])
                        }

                        // Forward API key header
                        if (req.headers['apikey']) {
                            proxyReq.setHeader('apikey', req.headers['apikey'])
                        }

                        // Forward Authorization header
                        if (req.headers['authorization']) {
                            proxyReq.setHeader('Authorization', req.headers['authorization'])
                        }

                        // FIX: Forward Prefer header - critical for PostgREST response format
                        // This header controls return format (return=minimal, return=representation)
                        // and is essential for .single() / .maybeSingle() to work correctly
                        if (req.headers['prefer']) {
                            proxyReq.setHeader('Prefer', req.headers['prefer'])
                        }

                        // Forward Range header for pagination
                        if (req.headers['range']) {
                            proxyReq.setHeader('Range', req.headers['range'])
                        }

                        // Forward Accept-Profile header for schema selection
                        if (req.headers['accept-profile']) {
                            proxyReq.setHeader('Accept-Profile', req.headers['accept-profile'])
                        }

                        // Forward Content-Profile header for schema selection on writes
                        if (req.headers['content-profile']) {
                            proxyReq.setHeader('Content-Profile', req.headers['content-profile'])
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
            // simple-peer and its Node.js polyfills
            'simple-peer',
            'readable-stream',
            'buffer',
            'util',
        ],
    },
})
