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
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
})

const PORT = process.env.PORT || 5000

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

// User presence tracking: Map<UserId, Set<SocketId>>
// Supports multiple connections per user (multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>()

// Track which conversation each socket is currently viewing
// Map<SocketId, { userId: string, receiverId: string }>
const socketConversations = new Map<string, { userId: string; receiverId: string }>()

// Track active typing indicators for auto-timeout cleanup
// Map<socketId, NodeJS.Timeout> - stores timeout for each active typing session
const typingTimeouts = new Map<string, NodeJS.Timeout>()

// Server-side timeout for auto-clearing typing indicators (safety net)
const TYPING_SERVER_TIMEOUT = 5000 // 5 seconds

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Socket.io connection handling with authentication
io.use((socket, next) => {
    // Extract userId from handshake auth
    const userId = socket.handshake.auth?.userId
    
    if (!userId) {
        console.log('⚠️ Connection rejected: Missing userId in handshake')
        return next(new Error('Authentication required'))
    }
    
    // Validate UUID format
    if (!UUID_REGEX.test(userId)) {
        console.log(`⚠️ Connection rejected: Invalid userId format: ${userId}`)
        return next(new Error('Invalid user ID format'))
    }
    
    socket.data.userId = userId
    next()
})

io.on('connection', async (socket) => {
    const userId = socket.data.userId as string
    console.log(`🔌 New client connected: ${socket.id} (User: ${userId})`)

    // Add this socket to user's connection set
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set())
    }
    const userSockets = onlineUsers.get(userId)!
    const wasFirstConnection = userSockets.size === 0
    userSockets.add(socket.id)

    // Send initial online users list to newly connected client
    const onlineUserIds = Array.from(onlineUsers.keys()).filter(id => id !== userId)
    socket.emit('initial_online_users', { userIds: onlineUserIds })

    // Only broadcast "online" if this is the FIRST connection for this user
    // (avoids multiple "online" events for same user with multiple tabs)
    if (wasFirstConnection) {
        // Broadcast to everyone EXCEPT the user themselves (optimization)
        socket.broadcast.emit('user_status', {
            userId,
            status: 'online',
        })
        console.log(`✅ User ${userId} is now online (first connection)`)
    } else {
        console.log(`✅ User ${userId} has ${userSockets.size} active connections`)
    }

    // Handle request for online users (used during reconnection)
    socket.on('request_online_users', () => {
        const onlineUserIds = Array.from(onlineUsers.keys()).filter(id => id !== userId)
        socket.emit('initial_online_users', { userIds: onlineUserIds })
        console.log(`📤 Sent ${onlineUserIds.length} online users to ${userId}`)
    })

    socket.on('disconnect', async () => {
        console.log(`🔌 Client disconnected: ${socket.id} (User: ${userId})`)

        // CRITICAL FIX #10: Clear typing timeout FIRST before other cleanup
        // This prevents memory leaks and errors when timeout fires after disconnect
        const typingTimeoutId = typingTimeouts.get(socket.id)
        if (typingTimeoutId) {
            clearTimeout(typingTimeoutId)
            typingTimeouts.delete(socket.id)
            console.log(`🧹 Cleared typing timeout for disconnected socket ${socket.id}`)
        }

        // Cleanup conversation tracking
        socketConversations.delete(socket.id)

        // Remove this specific socket from user's connection set
        const userSockets = onlineUsers.get(userId)
        if (userSockets) {
            userSockets.delete(socket.id)

            // Only mark offline if NO more connections exist for this user
            if (userSockets.size === 0) {
                onlineUsers.delete(userId)

                // Update last_seen in Supabase with proper error handling
                let actualLastSeen: string | undefined
                try {
                    const timestamp = new Date().toISOString()
                    const { error } = await supabaseAdmin
                        .from('profiles')
                        .update({ last_seen: timestamp })
                        .eq('id', userId)

                    if (error) {
                        console.error(`❌ Failed to update last_seen for user ${userId}:`, error)
                        // Don't include last_seen if DB update failed
                        actualLastSeen = undefined
                    } else {
                        console.log(`✅ Updated last_seen for user ${userId}`)
                        actualLastSeen = timestamp
                    }
                } catch (error) {
                    console.error(`❌ Exception updating last_seen for user ${userId}:`, error)
                    actualLastSeen = undefined
                }

                // Broadcast offline status only after DB operation completes
                // Only include last_seen if DB update was successful
                const offlineEvent: { userId: string; status: 'offline'; last_seen?: string } = {
                    userId,
                    status: 'offline',
                }
                if (actualLastSeen) {
                    offlineEvent.last_seen = actualLastSeen
                }
                io.emit('user_status', offlineEvent)
                console.log(`📤 User ${userId} is now offline (all connections closed)`)
            } else {
                console.log(`📤 User ${userId} still has ${userSockets.size} active connection(s)`)
            }
        }
    })

    // Example event for testing
    socket.on('test-message', (data) => {
        console.log('Test message received:', data)
        socket.emit('test-response', { message: 'Message received!', data })
    })

    // Typing indicator handlers
    socket.on('typing_start', (data: { receiverId: string }) => {
        const receiverId = data.receiverId
        
        // Validate receiverId format
        if (!receiverId || !UUID_REGEX.test(receiverId)) {
            console.log(`⚠️ Invalid receiverId in typing_start: ${receiverId}`)
            return
        }

        // Clear any existing timeout for this socket
        const existingTimeout = typingTimeouts.get(socket.id)
        if (existingTimeout) {
            clearTimeout(existingTimeout)
        }

        // Track the conversation for this socket
        socketConversations.set(socket.id, { userId, receiverId })
        
        // Find all sockets for the receiver and emit typing event
        const receiverSockets = onlineUsers.get(receiverId)
        if (receiverSockets) {
            receiverSockets.forEach((socketId) => {
                io.to(socketId).emit('user_typing', {
                    userId,
                    receiverId,
                    isTyping: true,
                })
            })
        }
        
        // ENHANCEMENT: Server-side timeout to auto-clear typing if client disconnects
        // This prevents "ghost typing" indicators
        const timeoutId = setTimeout(() => {
            // Auto-clear typing after timeout
            const receiverSocketsAfterTimeout = onlineUsers.get(receiverId)
            if (receiverSocketsAfterTimeout) {
                receiverSocketsAfterTimeout.forEach((socketId) => {
                    io.to(socketId).emit('user_typing', {
                        userId,
                        receiverId,
                        isTyping: false,
                    })
                })
            }
            typingTimeouts.delete(socket.id)
            console.log(`⏱️ Auto-cleared typing indicator for user ${userId} after ${TYPING_SERVER_TIMEOUT}ms timeout`)
        }, TYPING_SERVER_TIMEOUT)

        typingTimeouts.set(socket.id, timeoutId)
        console.log(`⌨️ User ${userId} started typing to ${receiverId}`)
    })

    socket.on('typing_stop', (data: { receiverId: string }) => {
        const receiverId = data.receiverId
        
        // Validate receiverId format
        if (!receiverId || !UUID_REGEX.test(receiverId)) {
            console.log(`⚠️ Invalid receiverId in typing_stop: ${receiverId}`)
            return
        }

        // Clear server-side timeout since user explicitly stopped typing
        const timeoutId = typingTimeouts.get(socket.id)
        if (timeoutId) {
            clearTimeout(timeoutId)
            typingTimeouts.delete(socket.id)
        }

        // Remove conversation tracking (optional, but good for cleanup)
        socketConversations.delete(socket.id)
        
        // Find all sockets for the receiver and emit typing stop event
        const receiverSockets = onlineUsers.get(receiverId)
        if (receiverSockets) {
            receiverSockets.forEach((socketId) => {
                io.to(socketId).emit('user_typing', {
                    userId,
                    receiverId,
                    isTyping: false,
                })
            })
        }
        
        console.log(`⌨️ User ${userId} stopped typing to ${receiverId}`)
    })
})

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
