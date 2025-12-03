import { motion } from 'framer-motion'
import { X, RefreshCw, Loader2 } from 'lucide-react'
import type { FilePreview as FilePreviewType } from '@/hooks/chat/useMediaUpload'

/**
 * File Preview Component
 * 
 * Responsibility: Display media preview with remove/retry buttons
 * Layer: UI Component (View)
 * 
 * Props:
 * - filePreview: Preview data (file, preview URL, type)
 * - isUploading: Upload in progress
 * - uploadError: Error message if upload failed
 * - onRemove: Remove preview callback
 * - onRetry: Retry upload callback
 */

interface FilePreviewProps {
    filePreview: FilePreviewType
    isUploading: boolean
    uploadError: string | null
    onRemove: () => void
    onRetry: () => void
}

export const FilePreview = ({
    filePreview,
    isUploading,
    uploadError,
    onRemove,
    onRetry,
}: FilePreviewProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
        >
            <div className="backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl p-2 flex items-center gap-2">
                {/* Preview thumbnail */}
                {filePreview.type === 'image' && (
                    <img
                        src={filePreview.preview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg"
                    />
                )}
                {filePreview.type === 'video' && (
                    <video
                        src={filePreview.preview}
                        className="w-16 h-16 object-cover rounded-lg"
                        muted
                    />
                )}
                {(filePreview.type === 'document' || filePreview.type === 'audio') && (
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                        {filePreview.type === 'audio' ? '🎤' : '📄'}
                    </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{filePreview.file.name}</p>
                    <p className="text-xs text-gray-500">
                        {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadError && (
                        <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                    )}
                </div>

                {/* Action buttons */}
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

            {/* Upload overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                    <div className="text-white text-sm flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Uploading...</span>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
