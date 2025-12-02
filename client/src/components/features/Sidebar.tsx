import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageCircle, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { logger } from '@/lib/logger'
import Button from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { SearchBar } from './SearchBar'
import { UserItem } from './UserItem'
import type { Profile } from '@/lib/services/profile.service'

export const Sidebar = () => {
  const { user, session, profile, profileLoading } = useAuthStore()
  const {
    selectedUser,
    setSelectedUser,
    conversations,
    conversationsLoading,
    conversationsError,
    fetchConversations,
    searchResults,
    searchLoading,
    isSearching,
    searchNewUsers,
    clearSearch,
  } = useChatStore()

  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!session || !user?.id) {
      return
    }
    fetchConversations()
    logger.info('Sidebar:mount', 'Fetching conversations for authenticated user')
  }, [session, user?.id, fetchConversations])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (value.trim() && user?.id) {
      searchTimeoutRef.current = setTimeout(() => {
        searchNewUsers(value, user.id)
      }, 300)
    } else if (!value.trim()) {
      clearSearch()
    }
  }

  const handleUserClick = (clickedUser: Profile) => {
    setSelectedUser(clickedUser)
    logger.info('Sidebar:handleUserClick', `Selected user: ${clickedUser.id}`)

    if (isSearching) {
      setSearchQuery('')
      clearSearch()
    }
  }

  const displayName =
    profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'

  const showSearchResults = searchQuery.trim().length > 0
  const displayList = showSearchResults ? searchResults : conversations
  const isLoading = showSearchResults ? searchLoading : conversationsLoading
  const error = showSearchResults ? null : conversationsError

  return (
    <aside className="w-full sm:w-[320px] md:w-[400px] flex-shrink-0 backdrop-blur-xl bg-white/70 border-r border-white/20 flex flex-col shadow-lg">
      <div className="p-4 border-b border-white/20">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-4"
        >
          He'loo
        </motion.h1>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30">
          <Avatar profile={profile} loading={profileLoading} size="md" />
          <div className="flex-1 min-w-0">
            {profileLoading ? (
              <>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-white/20">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search for new friends..."
        />

        <AnimatePresence>
          {showSearchResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mt-2 px-2"
            >
              <Users size={14} className="text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">Global Search</span>
              <button
                onClick={() => {
                  setSearchQuery('')
                  clearSearch()
                }}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Back to chats
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 sidebar-scroll">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/30 animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <Button variant="secondary" onClick={() => fetchConversations()} className="text-xs">
              Retry
            </Button>
          </div>
        ) : displayList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center px-4"
          >
            {showSearchResults ? (
              <>
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Search size={28} className="text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No users found</p>
                <p className="text-xs text-gray-500">Try a different search term</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-cyan-100 flex items-center justify-center mb-4">
                  <MessageCircle size={36} className="text-purple-500" />
                </div>
                <p className="text-base font-semibold text-gray-800 mb-2">No chats yet</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Search for a friend above to start your first conversation!
                </p>
                <motion.div
                  className="mt-4 flex items-center gap-1 text-purple-500"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Search size={14} />
                  <span className="text-xs font-medium">Type a name above</span>
                </motion.div>
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayList.map((listUser) => {
                const lastMessage =
                  'last_message' in listUser
                    ? (listUser as import('@/lib/services/user.service').ConversationProfile)
                        .last_message
                    : undefined

                const lastMessageTime =
                  'last_message_time' in listUser
                    ? (listUser as import('@/lib/services/user.service').ConversationProfile)
                        .last_message_time
                    : undefined

                const unreadCount =
                  'unread_count' in listUser
                    ? (listUser as import('@/lib/services/user.service').ConversationProfile)
                        .unread_count
                    : undefined

                return (
                  <motion.div
                    key={listUser.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UserItem
                      user={listUser}
                      isSelected={selectedUser?.id === listUser.id}
                      onClick={() => handleUserClick(listUser)}
                      lastMessage={lastMessage}
                      lastMessageTime={lastMessageTime}
                      unreadCount={unreadCount}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </aside>
  )
}

