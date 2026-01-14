/**
 * Story Constants
 * Shared constants for story editor and viewer
 *
 * @module constants/storyConstants
 */

// =============================================================================
// FILTERS
// =============================================================================

/** Available filters for stories */
export const FILTERS = [
    { name: 'Normal', value: 'none', previewColor: '#e4e4e7' },
    { name: 'Clarendon', value: 'contrast(1.2) saturate(1.35)', previewColor: '#4a90d9' },
    { name: 'Gingham', value: 'brightness(1.05) hue-rotate(-10deg) sepia(0.1)', previewColor: '#f5f5dc' },
    { name: 'Juno', value: 'contrast(1.1) saturate(1.4) sepia(0.1)', previewColor: '#ffd700' },
    { name: 'Lark', value: 'brightness(1.1) contrast(0.9) saturate(1.1)', previewColor: '#87ceeb' },
    { name: 'Mayfair', value: 'contrast(1.1) saturate(1.1) sepia(0.15)', previewColor: '#dda0dd' },
    { name: 'Warm', value: 'sepia(0.3) contrast(1.1) saturate(1.2)', previewColor: '#fcd34d' },
    { name: 'Cool', value: 'hue-rotate(180deg) saturate(0.8)', previewColor: '#60a5fa' },
    { name: 'Vintage', value: 'sepia(0.6) contrast(0.8) brightness(0.9)', previewColor: '#d97706' },
    { name: 'B&W', value: 'grayscale(1) contrast(1.2)', previewColor: '#52525b' },
    { name: 'Dreamy', value: 'brightness(1.1) saturate(1.2) blur(0.5px)', previewColor: '#f9a8d4' },
] as const

// =============================================================================
// REACTIONS
// =============================================================================

/** Quick reaction emojis */
export const REACTIONS = ['😂', '😮', '😍', '😢', '👏', '🔥'] as const

// =============================================================================
// TEXT STYLING
// =============================================================================

/** Text overlay colors - expanded Instagram-style palette */
export const TEXT_COLORS = [
    // Neutrals
    '#ffffff', '#000000', '#71717a', '#a1a1aa',
    // Reds
    '#ef4444', '#dc2626', '#b91c1c',
    // Oranges
    '#f97316', '#ea580c',
    // Yellows
    '#eab308', '#facc15',
    // Greens
    '#22c55e', '#16a34a', '#15803d',
    // Blues
    '#3b82f6', '#2563eb', '#1d4ed8',
    // Purples
    '#a855f7', '#9333ea', '#7c3aed',
    // Pinks
    '#ec4899', '#db2777', '#be185d',
    // Teals
    '#14b8a6', '#0d9488',
] as const

/** Text overlay fonts with display names */
export const TEXT_FONTS = [
    { name: 'Modern', class: 'font-sans' },
    { name: 'Serif', class: 'font-serif' },
    { name: 'Mono', class: 'font-mono' },
    { name: 'Bold', class: 'font-sans font-bold' },
    { name: 'Script', class: 'font-serif italic' },
] as const

// =============================================================================
// STICKERS
// =============================================================================

/** Sticker type definitions */
export const STICKER_TYPES = [
    // Interactive stickers
    { type: 'location', label: 'Location', color: 'text-red-500', icon: 'MapPin', defaultData: 'Add location', category: 'interactive' },
    { type: 'mention', label: 'Mention', color: 'text-blue-500', icon: 'AtSign', defaultData: '@username', category: 'interactive' },
    { type: 'poll', label: 'Poll', color: 'text-green-500', icon: 'BarChart2', defaultData: 'Yes / No', category: 'interactive' },
    { type: 'question', label: 'Question', color: 'text-purple-500', icon: 'HelpCircle', defaultData: 'Ask me anything', category: 'interactive' },
    // Decorative stickers
    { type: 'hashtag', label: 'Hashtag', color: 'text-cyan-500', icon: 'Hash', defaultData: '#topic', category: 'decorative' },
    { type: 'countdown', label: 'Countdown', color: 'text-orange-500', icon: 'Clock', defaultData: 'Event Name', category: 'decorative' },
] as const

/** Get stickers by category */
export const getStickersByCategory = (category: 'interactive' | 'decorative') =>
    STICKER_TYPES.filter(s => s.category === category)

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type FilterName = typeof FILTERS[number]['name']
export type FilterValue = typeof FILTERS[number]['value']
export type ReactionEmoji = typeof REACTIONS[number]
export type StickerType = typeof STICKER_TYPES[number]['type']
export type StickerCategory = typeof STICKER_TYPES[number]['category']
export type TextColor = typeof TEXT_COLORS[number]
export type TextFontName = typeof TEXT_FONTS[number]['name']
