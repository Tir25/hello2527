/**
 * ConnectionUserRow Component
 * 
 * User row for connections list.
 * @module features/profile/components/ConnectionUserRow
 */

import { memo } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { cleanUsername } from '@/lib/utils/string.utils'
import type { ConnectionUser } from '../services/connections.service'

interface ConnectionUserRowProps {
    user: ConnectionUser
    onClick: () => void
}

const ConnectionUserRowComponent = ({ user, onClick }: ConnectionUserRowProps) => {
    const displayUsername = cleanUsername(user.username)

    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                aria-label={`View profile of ${user.full_name || displayUsername || 'User'}`}
            >
                <Avatar
                    profile={{
                        id: user.id,
                        full_name: user.full_name,
                        username: user.username,
                        avatar_url: user.avatar_url,
                        email: '',
                        phone: null,
                        status: user.status,
                        last_seen: null,
                        created_at: null,
                    }}
                    size="md"
                />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                        {user.full_name || displayUsername || 'User'}
                    </p>
                    {displayUsername && (
                        <p className="text-sm text-gray-500 truncate">@{displayUsername}</p>
                    )}
                </div>
            </button>
        </li>
    )
}

export const ConnectionUserRow = memo(ConnectionUserRowComponent)
ConnectionUserRow.displayName = 'ConnectionUserRow'
