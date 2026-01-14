import { useEffect } from 'react'
import { socketService, type UserStatusEvent } from '@/lib/services/socket.service'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'

/**
 * Hook to manage user presence via Socket.io
 * Connects to socket server and listens for user status changes
 * Note: Socket remains connected on component unmount - only disconnects on logout
 */
export const usePresence = (userId: string | undefined) => {
  const { setUserOnline, setUserOffline } = useChatStore()

  useEffect(() => {
    if (!userId) {
      return
    }

    logger.info('usePresence', 'Setting up presence for user', userId)

    // Connect to socket server (reuses existing connection if available)
    socketService.connect(userId)

    // Track last processed initial users to prevent duplicate processing
    let lastInitialUsersHash = ''
    let lastInitialUsersTime = 0
    const DEBOUNCE_MS = 500

    // Handle initial online users list (sent when connecting)
    const handleInitialOnlineUsers = (userIds: string[]) => {
      // Create a simple hash of the user IDs for deduplication
      const sortedIds = [...userIds].sort().join(',')
      const now = Date.now()

      // Skip if same users received within debounce window
      if (sortedIds === lastInitialUsersHash && now - lastInitialUsersTime < DEBOUNCE_MS) {
        return // Silently skip duplicate
      }

      lastInitialUsersHash = sortedIds
      lastInitialUsersTime = now

      logger.info('usePresence:handleInitialOnlineUsers', 'Received initial online users', userIds)

      // Mark all online users as online (except ourselves)
      userIds.forEach((id) => {
        if (id !== userId) {
          setUserOnline(id)
        }
      })
    }

    // Handle user status events (real-time updates)
    const handleUserStatus = (event: UserStatusEvent) => {
      // FIX: Filter out events about ourselves FIRST (before logging)
      // This prevents unnecessary console noise
      if (event.userId === userId) {
        return
      }

      // Only log status events for other users (not ourselves)
      if (import.meta.env.DEV) {
        logger.info('usePresence:handleUserStatus', 'User status event', event)
      }

      if (event.status === 'online') {
        setUserOnline(event.userId)
      } else if (event.status === 'offline') {
        setUserOffline(event.userId, event.last_seen)
      }
    }

    // Subscribe to initial online users list
    socketService.onInitialOnlineUsers(handleInitialOnlineUsers)

    // Subscribe to user status events
    socketService.onUserStatus(handleUserStatus)

    // Cleanup on unmount - only remove listeners, keep socket connected
    // Socket will disconnect only on explicit logout
    return () => {
      logger.info('usePresence', 'Cleaning up presence listeners', userId)
      socketService.offUserStatus()
      socketService.offInitialOnlineUsers()
      // ✅ Keep socket connected, only remove listeners
    }
  }, [userId, setUserOnline, setUserOffline])
}

