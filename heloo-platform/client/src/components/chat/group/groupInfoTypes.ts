/**
 * Group Info Types
 * 
 * Type definitions for useGroupInfoState hook.
 * @module components/chat/group/groupInfoTypes
 */

export interface UseGroupInfoStateProps {
    groupId: string
    isOpen: boolean
    initialGroupName: string
    initialGroupAvatar?: string | null
    initialGroupDescription?: string | null
    onClose: () => void
}

export interface ConfirmDialogState {
    isOpen: boolean
    title: string
    message: string
    variant: 'default' | 'danger'
    onConfirm: () => void
}

export const initialConfirmState: ConfirmDialogState = {
    isOpen: false,
    title: '',
    message: '',
    variant: 'default',
    onConfirm: () => { },
}
