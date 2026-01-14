/**
 * Story Mention Processor
 * 
 * Handles sending DMs and notifications when users are mentioned in stories
 * 
 * @module services/stories/storyMentionProcessor
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { chatService } from '@/lib/services/chat.service'
import {
    extractMentions,
    resolveUsername,
    canViewStory,
    isConversationMuted
} from './storyMentionUtils'
import type { Story } from '@/types'
import type { StoryMentionPayload } from '@/types/database.types'

/**
 * Process mentions in a story and send DMs to mentioned users
 * Called asynchronously after story creation - does not block
 * 
 * @param story - The created story
 * @param senderId - The story creator's user ID
 */
export async function processStoryMentions(
    story: Story,
    senderId: string
): Promise<void> {
    const mentions = extractMentions(story.stickers)

    if (!mentions.length) {
        logger.info('processStoryMentions', 'No mentions found in story')
        return
    }

    logger.info('processStoryMentions', `Processing ${mentions.length} mentions`)

    // Track processed users to avoid duplicates
    const processed = new Set<string>()

    for (const username of mentions) {
        try {
            await processSingleMention(story, senderId, username, processed)
        } catch (err) {
            logger.error('processStoryMentions', `Failed to process mention: ${username}`, err)
        }
    }

    logger.info('processStoryMentions', `Completed processing ${processed.size} unique mentions`)
}

/**
 * Process a single mention - resolve username, validate access, send DM
 */
async function processSingleMention(
    story: Story,
    senderId: string,
    username: string,
    processed: Set<string>
): Promise<void> {
    // Resolve username to user ID
    const userId = await resolveUsername(username)

    if (!userId) {
        logger.warn('processStoryMentions', `User not found: ${username}`)
        return
    }

    // Skip self-mentions
    if (userId === senderId) {
        logger.info('processStoryMentions', 'Skipping self-mention')
        return
    }

    // Skip duplicates
    if (processed.has(userId)) {
        logger.info('processStoryMentions', `Skipping duplicate: ${username}`)
        return
    }
    processed.add(userId)

    // Check if user can view this story (close_friends check)
    const audienceType = story.audience_type || 'public'
    if (!await canViewStory(senderId, userId, audienceType)) {
        logger.info('processStoryMentions', `User cannot view story: ${username}`)
        return
    }

    // Check if conversation is muted (for notification read state)
    const muted = await isConversationMuted(userId, senderId)

    // Build payload
    const payload: StoryMentionPayload = {
        type: 'story_mention',
        storyId: story.id,
        storyOwnerId: senderId,
        thumbnailUrl: story.thumbnail_url,
        mediaUrl: story.media_url,
        expiresAt: story.expires_at,
        audienceType: audienceType as 'public' | 'close_friends'
    }

    // Send DM with rich payload
    const { success, error } = await chatService.sendMessage(
        'Mentioned you in their story',
        senderId,
        userId,
        story.thumbnail_url ?? undefined,
        story.thumbnail_url ? 'image' : undefined,
        undefined,
        payload
    )

    if (!success) {
        logger.warn('processStoryMentions', `DM send failed for ${username}: ${error}`)
        return
    }

    // Create notification (upsert to prevent duplicates)
    await createMentionNotification(story, senderId, userId, muted)

    logger.info('processStoryMentions', `Sent mention DM to ${username}`)
}

/**
 * Create a notification for the story mention
 */
async function createMentionNotification(
    story: Story,
    senderId: string,
    recipientId: string,
    muted: boolean
): Promise<void> {
    try {
        const { error } = await supabase
            .from('notifications')
            .upsert({
                recipient_id: recipientId,
                sender_id: senderId,
                type: 'story_mention',
                resource_id: story.id,
                resource_type: 'story',
                preview_image_url: story.thumbnail_url,
                is_read: muted // Mark as read if conversation is muted
            }, {
                onConflict: 'recipient_id,type,resource_id'
            })

        if (error) {
            logger.warn('createMentionNotification', 'Failed to create notification', error)
        }
    } catch (err) {
        logger.error('createMentionNotification', 'Unexpected error', err)
    }
}
