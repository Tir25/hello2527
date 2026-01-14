/**
 * MentionHighlight Component
 * 
 * Renders message text with highlighted @mentions and truncated URLs.
 * Ensures mentions don't break across lines.
 * 
 * Features:
 * - Visual highlight for @username mentions
 * - Truncates long URLs for cleaner display
 * - Prevents word-breaking in mentions (whitespace-nowrap)
 * - Different styling for own vs received messages
 * 
 * @module components/chat/mentions/MentionHighlight
 */

import { memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface MentionHighlightProps {
    /** Message content to render */
    content: string
    /** Whether this is the sender's own message (affects styling) */
    isOwn?: boolean
    /** Additional CSS classes */
    className?: string
}

/** Regex to match @username patterns (alphanumeric and underscores) */
const MENTION_REGEX = /@(\w+)/g

/** Regex to match URLs */
const URL_REGEX = /(https?:\/\/[^\s]+)/g

/** Maximum length for displayed URLs */
const MAX_URL_LENGTH = 35

/**
 * Truncates a URL if it exceeds the max length
 */
const truncateUrl = (url: string): string => {
    if (url.length <= MAX_URL_LENGTH) return url
    // Show domain and beginning of path
    try {
        const urlObj = new URL(url)
        const domain = urlObj.hostname
        const truncated = `${urlObj.protocol}//${domain}/...`
        return truncated
    } catch {
        // Fallback: simple truncation
        return url.slice(0, MAX_URL_LENGTH) + '...'
    }
}

/**
 * Pre-processes content to truncate URLs before highlighting
 */
const preprocessContent = (content: string): string => {
    return content.replace(URL_REGEX, (url) => truncateUrl(url))
}

const MentionHighlightComponent = ({
    content,
    isOwn = false,
    className,
}: MentionHighlightProps) => {
    const highlightedContent = useMemo(() => {
        // First, truncate any long URLs in the content
        const processedContent = preprocessContent(content)

        const parts: ReactNode[] = []
        let lastIndex = 0
        let match: RegExpExecArray | null

        // Reset regex state
        MENTION_REGEX.lastIndex = 0

        while ((match = MENTION_REGEX.exec(processedContent)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(processedContent.substring(lastIndex, match.index))
            }

            // Add the highlighted mention with nowrap to prevent breaking
            parts.push(
                <span
                    key={`${match.index}-${match[0]}`}
                    className={cn(
                        "font-semibold inline-block whitespace-nowrap",
                        isOwn
                            ? "text-white bg-white/25 px-1.5 py-0.5 rounded-md"
                            : "text-purple-700 bg-purple-100/80 px-1.5 py-0.5 rounded-md"
                    )}
                >
                    {match[0]}
                </span>
            )

            lastIndex = match.index + match[0].length
        }

        // Add remaining text
        if (lastIndex < processedContent.length) {
            parts.push(processedContent.substring(lastIndex))
        }

        return parts.length > 0 ? parts : processedContent
    }, [content, isOwn])

    return (
        <span className={className}>
            {highlightedContent}
        </span>
    )
}

export const MentionHighlight = memo(MentionHighlightComponent)
MentionHighlight.displayName = 'MentionHighlight'
