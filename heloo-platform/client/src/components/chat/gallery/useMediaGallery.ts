/**
 * useMediaGallery Hook
 * 
 * Fetches and filters media for the gallery modal.
 * @module components/chat/gallery/useMediaGallery
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { MediaItem } from './MediaThumbnail'

export type MediaFilter = 'all' | 'images' | 'videos' | 'documents'

interface UseMediaGalleryOptions {
    conversationId: string
    currentUserId?: string
    isGroup: boolean
    chatDeletedAt?: string | null
    isOpen: boolean
}

export function useMediaGallery({
    conversationId,
    currentUserId,
    isGroup,
    chatDeletedAt,
    isOpen,
}: UseMediaGalleryOptions) {
    const [media, setMedia] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<MediaFilter>('all')

    const fetchMedia = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            let query = supabase
                .from('messages')
                .select('id, media_url, media_type, created_at, sender_id')
                .not('media_url', 'is', null)
                .not('media_type', 'is', null)
                .eq('is_unsent', false)
                .order('created_at', { ascending: false })
                .limit(100)

            if (isGroup) {
                query = query.eq('group_id', conversationId)
            } else if (currentUserId) {
                query = query
                    .is('group_id', null)
                    .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${currentUserId})`)

                if (chatDeletedAt) {
                    query = query.gt('created_at', chatDeletedAt)
                }
            }

            const { data, error: queryError } = await query

            if (queryError) throw queryError

            const mediaItems = (data || []).filter(
                (item): item is MediaItem => !!item.media_url && !!item.media_type
            )

            setMedia(mediaItems)
        } catch (err) {
            logger.error('MediaGalleryModal', 'Failed to fetch media', err)
            setError('Failed to load media')
        } finally {
            setLoading(false)
        }
    }, [conversationId, currentUserId, isGroup, chatDeletedAt])

    useEffect(() => {
        if (isOpen && conversationId) {
            fetchMedia()
        }
    }, [isOpen, conversationId, fetchMedia])

    const filteredMedia = useMemo(() => {
        switch (filter) {
            case 'images': return media.filter(m => m.media_type === 'image')
            case 'videos': return media.filter(m => m.media_type === 'video')
            case 'documents': return media.filter(m => m.media_type === 'document' || m.media_type === 'audio')
            default: return media
        }
    }, [media, filter])

    return { media, filteredMedia, loading, error, filter, setFilter, fetchMedia }
}
