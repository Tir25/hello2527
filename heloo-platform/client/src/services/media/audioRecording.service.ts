import { logger } from '@/lib/logger'

/**
 * Audio Recording Service
 * 
 * Responsibility: Raw browser MediaRecorder API interactions
 * Layer: Service (Data)
 * 
 * Functions:
 * - getSupportedAudioMimeType: Detect browser support for audio formats
 * - requestMicrophoneAccess: Request user permission for microphone
 * - createAudioRecorder: Create and configure MediaRecorder instance
 * - createAudioFile: Convert recording blob to File object
 */

export interface AudioRecorderConfig {
    mimeType: string
}

export interface RecordingError {
    type: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'UnknownError'
    message: string
}

/**
 * Detects and returns the first supported audio MIME type
 * Tests in priority order: webm/opus, webm, mp4, ogg/opus, aac
 */
export const getSupportedAudioMimeType = (): string | null => {
    const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/aac',
    ]

    for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            logger.info('media:recording:mime-type-detected', `Using MIME type: ${mimeType}`)
            return mimeType
        }
    }

    logger.error('media:recording:no-mime-type', 'No supported audio MIME type found')
    return null
}

/**
 * Requests microphone access from the user
 * 
 * @returns MediaStream if permission granted
 * @throws RecordingError if permission denied or microphone unavailable
 */
export const requestMicrophoneAccess = async (): Promise<globalThis.MediaStream> => {
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error: RecordingError = {
            type: 'UnknownError',
            message: "Your browser doesn't support audio recording",
        }
        logger.error('media:recording:not-supported', 'Browser does not support getUserMedia')
        throw error
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        logger.info('media:recording:mic-access-granted', 'Microphone access granted')
        return stream
    } catch (error) {
        if (error instanceof Error) {
            let recordingError: RecordingError

            switch (error.name) {
                case 'NotAllowedError':
                    recordingError = {
                        type: 'NotAllowedError',
                        message: 'Microphone access denied. Please allow access in browser settings.',
                    }
                    break
                case 'NotFoundError':
                    recordingError = {
                        type: 'NotFoundError',
                        message: 'No microphone found.',
                    }
                    break
                case 'NotReadableError':
                    recordingError = {
                        type: 'NotReadableError',
                        message: 'Microphone is already in use by another application.',
                    }
                    break
                default:
                    recordingError = {
                        type: 'UnknownError',
                        message: 'Failed to access microphone. Please check permissions.',
                    }
            }

            logger.error('media:recording:mic-access-denied', recordingError.message, error)
            throw recordingError
        }

        // Non-Error object thrown
        const unknownError: RecordingError = {
            type: 'UnknownError',
            message: 'Failed to access microphone.',
        }
        logger.error('media:recording:unexpected-error', 'Unexpected error type', error)
        throw unknownError
    }
}

/**
 * Creates a MediaRecorder instance with the given stream and MIME type
 */
export const createAudioRecorder = (
    stream: globalThis.MediaStream,
    mimeType: string
): MediaRecorder => {
    const mediaRecorder = new MediaRecorder(stream, { mimeType })
    logger.info('media:recording:recorder-created', `MediaRecorder created with ${mimeType}`)
    return mediaRecorder
}

/**
 * Converts audio recording chunks to a File object
 * 
 * @param chunks - Array of Blob chunks from MediaRecorder
 * @param mimeType - MIME type used for recording
 * @returns Audio File ready for upload
 */
export const createAudioFile = (chunks: Blob[], mimeType: string): File => {
    const mimeTypeBase = mimeType.split(';')[0] // Remove codecs part
    const audioBlob = new Blob(chunks, { type: mimeTypeBase })
    const fileExt = mimeTypeBase.split('/')[1] || 'webm'
    const audioFile = new File([audioBlob], `recording-${Date.now()}.${fileExt}`, {
        type: mimeTypeBase,
    })

    logger.info('media:recording:file-created', `Recording file created - Size: ${audioFile.size}, Type: ${mimeTypeBase}`)
    return audioFile
}

/**
 * Stops all tracks in a MediaStream (releases microphone)
 */
export const stopMediaStream = (stream: globalThis.MediaStream): void => {
    stream.getTracks().forEach((track) => track.stop())
    logger.info('media:recording:stream-stopped', 'All media tracks stopped')
}
