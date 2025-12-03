import { io, Socket } from 'socket.io-client'
import { logger } from '@/lib/logger'
import { config } from '@/lib/config'

// Use centralized configuration with proper environment handling
const API_URL = config.apiUrl

let socket: Socket | null = null
let isReconnecting = false
let connectedUserId: string | null = null // Track which user the socket is connected for

// Internal callback handlers (prevent memory leaks)
let userStatusCallback: ((event: UserStatusEvent) => void) | null = null
let initialOnlineUsersCallback: ((userIds: string[]) => void) | null = null
let userTypingCallback: ((event: UserTypingEvent) => void) | null = null

interface UserStatusEvent {
  userId: string
  status: 'online' | 'offline'
  last_seen?: string
}

interface InitialOnlineUsersEvent {
  userIds: string[]
}

interface UserTypingEvent {
  userId: string
  receiverId: string
  isTyping: boolean
}

export const socketService = {
  /**
   * Connect to socket.io server with user authentication
   * Returns existing socket instance if one exists (even if still connecting)
   * to prevent duplicate connections in React StrictMode or rapid remounts
   * Disconnects and reconnects if userId changes (e.g., logout/login)
   */
  connect(userId: string): Socket {
    // If socket exists but userId changed, disconnect and reconnect with new userId
    if (socket && connectedUserId && connectedUserId !== userId) {
      logger.info('socket:connect', `User changed from ${connectedUserId} to ${userId}, reconnecting...`)
      socket.disconnect()
      socket = null
      connectedUserId = null
    }

    // Return existing socket if it exists (regardless of connection state)
    // This prevents duplicate connections during React StrictMode double-mounts
    if (socket) {
      logger.info('socket:connect', 'Reusing existing socket instance', socket.id || 'connecting...')
      return socket
    }

    connectedUserId = userId
    logger.info('socket:connect', `Creating new socket connection to ${API_URL} with userId: ${userId}`)

    socket = io(API_URL, {
      auth: {
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    // Register event listeners only once (prevents memory leaks)
    this._setupEventListeners(socket)

    return socket
  },

  /**
   * Disconnect from socket.io server
   */
  disconnect(): void {
    if (socket) {
      logger.info('socket:disconnect', 'Disconnecting socket')
      socket.disconnect()
      socket = null
      connectedUserId = null
    }
  },

  /**
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return socket
  },

  /**
   * Internal method to setup event listeners (prevents duplicates)
   * Called once during socket initialization to register all event handlers
   * Uses internal callback pattern to prevent memory leaks from duplicate listeners
   * @private
   * @param socketInstance - The Socket.io client instance to attach listeners to
   */
  _setupEventListeners(socketInstance: Socket): void {
    // User status handler (single listener, calls internal callback)
    socketInstance.on('user_status', (event: UserStatusEvent) => {
      if (userStatusCallback) {
        logger.info('socket:user_status', 'User status event received', event)
        userStatusCallback(event)
      }
    })

    // Initial online users handler
    socketInstance.on('initial_online_users', (data: InitialOnlineUsersEvent) => {
      if (initialOnlineUsersCallback) {
        logger.info('socket:initial_online_users', 'Received initial online users', data)
        initialOnlineUsersCallback(data.userIds)
      }
    })

    // User typing handler
    socketInstance.on('user_typing', (event: UserTypingEvent) => {
      if (userTypingCallback) {
        // LOW FIX #8: Use debug level for frequent typing events
        logger.debug('socket:user_typing', 'User typing event received', event)
        userTypingCallback(event)
      }
    })

    // Connection events
    socketInstance.on('connect', () => {
      logger.info('socket:connect', 'Socket connected successfully', socketInstance.id)

      if (isReconnecting) {
        logger.info('socket:reconnect', 'Socket reconnected, requesting fresh state')
        // Request fresh online users list after reconnection
        socketInstance.emit('request_online_users')
        isReconnecting = false
      }
    })

    socketInstance.on('disconnect', (reason) => {
      logger.warn('socket:disconnect', `Socket disconnected: ${reason}`)

      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, need to manually reconnect
        socketInstance.connect()
      }

      // Mark as reconnecting (will trigger state refresh on reconnect)
      isReconnecting = true
    })

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      logger.info('socket:reconnect_attempt', `Reconnection attempt ${attemptNumber}`)
      isReconnecting = true
    })

    socketInstance.on('reconnect_failed', () => {
      logger.error('socket:reconnect_failed', 'Failed to reconnect after max attempts')
      isReconnecting = false
      // Optionally notify user or trigger manual reconnection
    })

    socketInstance.on('connect_error', (error) => {
      logger.error('socket:connect_error', 'Socket connection error', error)
    })
  },

  /**
   * Subscribe to user status changes
   * Uses internal callback pattern to prevent memory leaks
   */
  onUserStatus(callback: (event: UserStatusEvent) => void): void {
    if (!socket) {
      logger.error('socket:onUserStatus', 'Socket not connected')
      return
    }

    // Store callback (will be called by internal handler)
    userStatusCallback = callback
  },

  /**
   * Unsubscribe from user status changes
   */
  offUserStatus(): void {
    userStatusCallback = null
  },

  /**
   * Subscribe to initial online users list
   */
  onInitialOnlineUsers(callback: (userIds: string[]) => void): void {
    if (!socket) {
      logger.error('socket:onInitialOnlineUsers', 'Socket not connected')
      return
    }

    // Store callback (will be called by internal handler)
    initialOnlineUsersCallback = callback
  },

  /**
   * Unsubscribe from initial online users
   */
  offInitialOnlineUsers(): void {
    initialOnlineUsersCallback = null
  },

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return socket?.connected ?? false
  },

  /**
   * Emit typing start event
   * @returns true if event was emitted successfully, false otherwise
   */
  emitTypingStart(receiverId: string): boolean {
    if (!socket || !socket.connected) {
      logger.warn('socket:emitTypingStart', `Socket not connected. Cannot emit typing_start to ${receiverId}`)
      return false
    }

    try {
      socket.emit('typing_start', { receiverId })
      // LOW FIX #8: Use debug level for frequent typing events
      logger.debug('socket:emitTypingStart', `Emitted typing_start to ${receiverId}`)
      return true
    } catch (error) {
      logger.error('socket:emitTypingStart', `Failed to emit typing_start to ${receiverId}`, error)
      return false
    }
  },

  /**
   * Emit typing stop event
   * @returns true if event was emitted successfully, false otherwise
   */
  emitTypingStop(receiverId: string): boolean {
    if (!socket || !socket.connected) {
      logger.warn('socket:emitTypingStop', `Socket not connected. Cannot emit typing_stop to ${receiverId}`)
      return false
    }

    try {
      socket.emit('typing_stop', { receiverId })
      // LOW FIX #8: Use debug level for frequent typing events
      logger.debug('socket:emitTypingStop', `Emitted typing_stop to ${receiverId}`)
      return true
    } catch (error) {
      logger.error('socket:emitTypingStop', `Failed to emit typing_stop to ${receiverId}`, error)
      return false
    }
  },

  /**
   * Subscribe to user typing events
   */
  onUserTyping(callback: (event: UserTypingEvent) => void): void {
    if (!socket) {
      logger.error('socket:onUserTyping', 'Socket not connected')
      return
    }

    userTypingCallback = callback
  },

  /**
   * Unsubscribe from user typing events
   */
  offUserTyping(): void {
    userTypingCallback = null
  },
}

export type { UserStatusEvent, InitialOnlineUsersEvent, UserTypingEvent }

