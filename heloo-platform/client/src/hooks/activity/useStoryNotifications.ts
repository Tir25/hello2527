/**
 * useStoryNotifications Hook
 * Fetches story-related notifications from the notifications table
 *
 * @module hooks/activity/useStoryNotifications
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export interface StoryNotification {
    id: string
    type: 'story_question_response' | 'story_mention'
    sender_id: string
    resource_id: string
    preview_image_url: string | null
    is_read: boolean
    created_at: string
    sender?: {
        username: string
        avatar_url: string | null
    }
}

interface UseStoryNotificationsResult {
    notifications: StoryNotification[]
    loading: boolean
    markAsRead: (id: string) => Promise<void>
}

/**
 * Fetches story notifications (question responses, mentions)
 */
export function useStoryNotifications(): UseStoryNotificationsResult {
    const [notifications, setNotifications] = useState<StoryNotification[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuthStore()

    useEffect(() => {
        if (!user) {
            setNotifications([])
            setLoading(false)
            return
        }

        let mounted = true

        async function fetchNotifications() {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    id,
                    type,
                    sender_id,
                    resource_id,
                    preview_image_url,
                    is_read,
                    created_at,
                    profiles!sender_id (
                        username,
                        avatar_url
                    )
                `)
                .eq('recipient_id', user!.id)
                .in('type', ['story_question_response', 'story_mention'])
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) {
                console.error('Failed to fetch story notifications:', error)
                if (mounted) setLoading(false)
                return
            }

            if (mounted) {
                const mapped = (data || []).map(row => {
                    const profile = row.profiles as unknown as { username: string; avatar_url: string | null } | null
                    return {
                        id: row.id,
                        type: row.type as StoryNotification['type'],
                        sender_id: row.sender_id,
                        resource_id: row.resource_id,
                        preview_image_url: row.preview_image_url,
                        is_read: row.is_read,
                        created_at: row.created_at,
                        sender: profile ? {
                            username: profile.username,
                            avatar_url: profile.avatar_url
                        } : undefined
                    }
                })
                setNotifications(mapped)
                setLoading(false)
            }
        }

        fetchNotifications()

        return () => { mounted = false }
    }, [user])

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        )
    }

    return { notifications, loading, markAsRead }
}
