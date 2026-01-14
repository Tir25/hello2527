/**
 * SignalingService Error Helper
 * 
 * Creates typed SignalingError instances.
 * @module services/webrtc/signaling/createError
 */

import type { SignalingError, SignalingErrorCode } from '@/types/webrtc'

export function createSignalingError(
    code: SignalingErrorCode,
    message: string,
    details?: Record<string, unknown>
): SignalingError {
    const error = new Error(message) as SignalingError
    error.name = 'SignalingError'
    error.code = code
    error.details = details
    return error
}
