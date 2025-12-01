import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { getUsers } from '@/services/userService'
import { logger } from '@/lib/logger'
import Button from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { SearchBar } from './SearchBar'
import { UserItem } from './UserItem'

export const Sidebar = () => {
  const { user, profile, profileLoading } = useAuthStore()
  const { selectedUser, users, setSelectedUser, setUsers } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await getUsers(user.id)

        if (result.success && result.data) {
          setUsers(result.data)
          logger.info('Sidebar:fetchUsers', `Loaded ${result.data.length} users`)
        } else {
          setError(result.error || 'Failed to load users')
          logger.error('Sidebar:fetchUsers', 'Failed to fetch users', result.error)
        }
      } catch (err) {
        const errorMessage = 'An unexpected error occurred'
        setError(errorMessage)
        logger.error('Sidebar:fetchUsers', 'Unexpected error', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user?.id, setUsers])

  // Filter users based on search query
  const filteredUsers = users.filter((u) => {
    const name = (u.full_name || u.username || u.email || '').toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // Handle user selection
  const handleUserClick = (user: typeof users[0]) => {
    setSelectedUser(user)
    logger.info('Sidebar:handleUserClick', `Selected user: ${user.id}`)
  }

  // Get display name for current user
  const displayName =
    profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'

  return (
    <aside className="w-[400px] flex-shrink-0 backdrop-blur-xl bg-white/70 border-r border-white/20 flex flex-col shadow-lg">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/20">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-4"
        >
          He'loo
        </motion.h1>

        {/* User Profile Info */}
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

      {/* Search Bar */}
      <div className="p-4 border-b border-white/20">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 sidebar-scroll">
        {loading ? (
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
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search size={32} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              {searchQuery ? 'No users found' : 'No users available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <UserItem
                key={user.id}
                user={user}
                isSelected={selectedUser?.id === user.id}
                onClick={() => handleUserClick(user)}
              />
            ))}
          </div>
        )}
      </div>

    </aside>
  )
}

