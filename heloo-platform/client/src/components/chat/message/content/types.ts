/**
 * Shared types for message content components
 */

import type { DatabaseMessage } from '@/types'
import type { Profile } from '@/lib/services/profile.service'

export interface MediaContentProps {
    message: DatabaseMessage
    isOwn: boolean
    recipientProfile?: Profile | null
    isLastMessage?: boolean
    displayUrl: string
    hasTextContent: boolean
}

export interface ImageContentProps extends MediaContentProps {
    onImageClick?: (url: string) => void
}
