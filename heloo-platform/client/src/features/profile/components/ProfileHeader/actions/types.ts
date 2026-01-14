/**
 * Action Button Types & Shared Props
 * 
 * Centralized types for action bar components
 */

import type { RefObject } from 'react'
import type { Profile } from '../../../types/profile.types'

export interface BaseActionProps {
    profile: Profile
    loading: boolean
}

export interface FollowingActionsProps extends BaseActionProps {
    showMenu: boolean
    menuRef: RefObject<HTMLDivElement | null>
    buttonRef: RefObject<HTMLButtonElement | null>
    firstMenuItemRef: RefObject<HTMLButtonElement | null>
    onSetShowMenu: (show: boolean) => void
    onMessage: () => void
    onShowUnfollowConfirm: () => void
    onShowBlockConfirm: () => void
}

export interface PendingActionsProps extends BaseActionProps {
    onCancelRequest?: () => void
    onMessage: () => void
}

export interface IncomingRequestActionsProps extends BaseActionProps {
    acceptLoading: boolean
    declineLoading: boolean
    onAccept?: () => void
    onDecline?: () => void
}

export interface FollowBackActionsProps extends BaseActionProps {
    onFollow: () => void
    onMessage: () => void
}

export interface FollowActionsProps extends BaseActionProps {
    onFollow: () => void
    onMessage: () => void
}
