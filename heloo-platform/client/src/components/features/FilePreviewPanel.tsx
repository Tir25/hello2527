/**
 * FilePreviewPanel Component
 * 
 * Responsibility: Display file preview with upload state
 * Layer: UI Component (Presentational)
 * 
 * Extracted from MessageInput to improve modularity.
 * Displays:
 * - Image/video thumbnails
 * - Document/audio placeholders  
 * - File name and size
 * - Upload progress overlay
 * - Error state with retry option
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, RefreshCw } from 'lucide-react'

export interface FilePreview {
    file: File
    preview: string
    type: 'image' | 'video' | 'document' | 'audio'
    error?: string
}

interface FilePreviewPanelProps {
    filePreview: FilePreview | null
    isUploading: boolean
    uploadError: string | null
    onRemove: () => void
    onRetry: () => void
}

/**
 * Displays a preview of the selected file with upload state
 */
export const FilePreviewPanel = ({
    filePreview,
    isUploading,
    uploadError,
    onRemove,
    onRetry,
}: FilePreviewPanelProps) => {
    if (!filePreview) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
            >
                <div className="backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl p-2 flex items-center gap-2">
                    {/* Preview Thumbnail */}
                    <PreviewThumbnail filePreview={filePreview} />

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{filePreview.file.name}</p>
                        <p className="text-xs text-gray-500">
                            {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {uploadError && (
                            <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {uploadError && !isUploading && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onRetry}
                                className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                                aria-label="Retry upload"
                            >
                                <RefreshCw size={18} />
                            </motion.button>
                        )}
                        {!isUploading && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onRemove}
                                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                aria-label="Remove preview"
                            >
                                <X size={18} />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Upload Overlay */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <div className="text-white text-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Uploading...</span>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    )
}

/**
 * Preview thumbnail based on file type
 */
const PreviewThumbnail = ({ filePreview }: { filePreview: FilePreview }) => {
    const { type, preview } = filePreview

    if (type === 'image') {
        return (
            <img
                src={preview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg"
            />
        )
    }

    if (type === 'video') {
        return (
            <video
                src={preview}
                className="w-16 h-16 object-cover rounded-lg"
                muted
            />
        )
    }

    // Document or Audio placeholder
    return (
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-medium">
            {type === 'audio' ? '🎤' : '📄'}
        </div>
    )
}
