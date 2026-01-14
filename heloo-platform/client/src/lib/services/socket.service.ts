import { io, Socket } from 'socket.io-client'
import { logger } from '@/lib/logger'
import { config } from '@/lib/config'
import type {
  UserStatusEvent,
  InitialOnlineUsersEvent,
  UserTypingEvent,
  ReactionUpdateEvent,
  MessageReceiveEvent
} from '@/types/socket.types'

const API_URL = config.apiUrl

let socket: Socket | null = null
let isReconnecting = false
let connectedUserId: string | null = null


// Internal callbacks
let userStatusCb: ((e: UserStatusEvent) => void) | null = null
let initialUsersCb: ((ids: string[]) => void) | null = null
let userTypingCb: ((e: UserTypingEvent) => void) | null = null
let reactionCb: ((e: ReactionUpdateEvent) => void) | null = null
let messageCb: ((e: MessageReceiveEvent) => void) | null = null

export const socketService = {
  connect(userId: string): Socket {
    if (socket && connectedUserId && connectedUserId !== userId) {
      socket.disconnect()
      socket = null
      connectedUserId = null

    }

    if (socket) return socket

    connectedUserId = userId
    logger.info('socket:connect', `Click connect ${userId}`)

    socket = io(API_URL, {
      auth: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      // Keep connection alive
      forceNew: false,
    })

    this._setupEventListeners(socket)
    return socket
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect()
      socket = null
      connectedUserId = null

    }
  },

  getSocket(): Socket | null { return socket },

  _setupEventListeners(s: Socket): void {
    s.on('user_status', (e: UserStatusEvent) => userStatusCb?.(e))
    s.on('initial_online_users', (d: InitialOnlineUsersEvent) => initialUsersCb?.(d.userIds))
    s.on('user_typing', (e: UserTypingEvent) => userTypingCb?.(e))
    s.on('reaction_update', (e: ReactionUpdateEvent) => reactionCb?.(e))
    s.on('message_receive', (e: MessageReceiveEvent) => messageCb?.(e))

    s.on('connect', () => {
      logger.info('socket:connect', 'Socket connected successfully', { socketId: s.id })
      if (isReconnecting) {
        s.emit('request_online_users')
        isReconnecting = false
      }
    })

    s.on('disconnect', (reason) => {
      logger.warn('socket:disconnect', 'Socket disconnected', { reason })
      if (reason === 'io server disconnect') s.connect()
      isReconnecting = true
    })

    s.on('connect_error', (error) => {
      logger.error('socket:connect_error', 'Socket connection error', { message: error.message })
    })
  },

  // --- Handlers Registration ---
  onUserStatus(cb: (e: UserStatusEvent) => void) { userStatusCb = cb },
  offUserStatus() { userStatusCb = null },

  onInitialOnlineUsers(cb: (ids: string[]) => void) { initialUsersCb = cb },
  offInitialOnlineUsers() { initialUsersCb = null },

  onUserTyping(cb: (e: UserTypingEvent) => void) { userTypingCb = cb },
  offUserTyping() { userTypingCb = null },

  onReactionUpdate(cb: (e: ReactionUpdateEvent) => void) { reactionCb = cb },
  offReactionUpdate() { reactionCb = null },

  onMessageReceive(cb: (e: MessageReceiveEvent) => void) { messageCb = cb },
  offMessageReceive() { messageCb = null },

  // --- Actions ---
  isConnected(): boolean { return socket?.connected ?? false },

  joinConversation(conversationId: string): boolean {
    if (!socket?.connected) {
      logger.warn('socket:joinConversation', 'Socket not connected, cannot join room')
      return false
    }
    socket.emit('join_conversation', { conversationId })
    return true
  },

  leaveConversation(conversationId: string): boolean {
    if (!socket?.connected) return false
    socket.emit('leave_conversation', { conversationId })
    return true
  },

  sendMessage(conversationId: string, message: any): boolean {
    if (!socket?.connected) {
      logger.warn('socket:sendMessage', 'Socket not connected, message not sent via socket')
      return false
    }
    socket.emit('message_send', { conversationId, message })
    return true
  },

  /**
   * Send a reaction via Socket.IO for real-time sync
   * @returns true if socket was connected and emission was attempted
   */
  sendReaction(messageId: string, conversationId: string, emoji: string, type: 'add' | 'remove'): boolean {
    if (!socket?.connected) {
      logger.warn('socket:sendReaction', 'Socket not connected, reaction sync may be delayed', {
        messageId, emoji, type
      })
      return false
    }
    socket.emit('reaction_send', { messageId, conversationId, emoji, type })
    logger.debug('socket:sendReaction', 'Reaction sent', { messageId, emoji, type })
    return true
  },

  emitTypingStart(options: { receiverId?: string; groupId?: string }): boolean {
    if (!socket?.connected) return false
    const { receiverId, groupId } = options
    if (groupId) socket.emit('typing_start', { groupId })
    else socket.emit('typing_start', { receiverId })
    return true
  },

  emitTypingStop(options: { receiverId?: string; groupId?: string }): boolean {
    if (!socket?.connected) return false
    const { receiverId, groupId } = options
    if (groupId) socket.emit('typing_stop', { groupId })
    else socket.emit('typing_stop', { receiverId })
    return true
  }
}

// Re-export types for backwards compatibility
export type {
  UserStatusEvent,
  InitialOnlineUsersEvent,
  UserTypingEvent,
  ReactionUpdateEvent,
  MessageReceiveEvent
} from '@/types/socket.types'

