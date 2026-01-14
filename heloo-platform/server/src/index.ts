import express, { Request, Response } from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config()

// Initialize Supabase Admin Client (server-side only)
// Service role key bypasses RLS by default in Supabase.
// This allows the server to update last_seen for any user without requiring
// a specific RLS policy for the service role.
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        db: {
            schema: 'public',
        },
    }
)

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: [
            process.env.CLIENT_URL || 'http://localhost:3000',
            'https://hello2527.vercel.app',
            'http://localhost:5173',
            'http://localhost:3000',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    // Improve connection stability
    pingTimeout: 60000,
    pingInterval: 25000,
})

const PORT = process.env.PORT || 5001

// Middleware
app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: "He'loo Server Running",
        timestamp: new Date().toISOString(),
    })
})

// API routes
app.get('/api/v1', (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome to He'loo API v1",
        version: '1.0.0',
    })
})

// Auto-confirm email endpoint (development only)
// This allows users to login immediately after signup
app.post('/api/auth/confirm-email', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required',
            })
        }

        // Only allow in development environment
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                error: 'Auto-confirmation is disabled in production',
            })
        }

        // Use admin client to update user email confirmation
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            {
                email_confirm: true,
            }
        )

        if (error) {
            console.error('❌ Failed to confirm email:', error)
            return res.status(400).json({
                success: false,
                error: error.message || 'Failed to confirm email',
            })
        }

        console.log('✅ Email auto-confirmed for user:', userId)
        return res.status(200).json({
            success: true,
            message: 'Email confirmed successfully',
            user: data.user,
        })
    } catch (error) {
        console.error('❌ Unexpected error confirming email:', error)
        return res.status(500).json({
            success: false,
            error: 'An unexpected error occurred',
        })
    }
})

// Import modular socket initializer
import { initializeSocketIO } from './socket';

// Initialize Socket.IO with modular handlers
initializeSocketIO(io, supabaseAdmin);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    })
})

// Start server
server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════╗
  ║                                      ║
  ║    🚀 He'loo Server Running          ║
  ║                                      ║
  ║    📡 Port: ${PORT}                     ║
  ║    🌐 Environment: ${process.env.NODE_ENV || 'development'}      ║
  ║    ⚡ Socket.io: Active              ║
  ║                                      ║
  ╚══════════════════════════════════════╝
  `)
})

export default app
