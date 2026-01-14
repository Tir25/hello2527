/**
 * ActionBar Component (Refactored)
 * 
 * Responsibility: Orchestrate which action buttons to display
 * Layer: UI (Container Component)
 * 
 * LOGIC:
 * - isOwnProfile → Edit Profile
 * - blocked → Unblock
 * - amIFollowing → Message + Following + Menu
 * - isPendingOutgoing → Requested
 * - isPendingIncoming → Accept/Decline
 * - isFollowingMe && !amIFollowing → Follow Back
 * - none → Follow
 */

import { RefObject } from 'react'
import Button from '@/components/ui/Button'
import type { Profile } from '../../types/profile.types'
import {
  FollowingActions,
  PendingActions,
  IncomingRequestActions,
  FollowBackActions,
  FollowActions,
} from './actions'

interface ActionBarProps {
  profile: Profile
  isOwnProfile: boolean
  loading: boolean
  acceptLoading?: boolean
  declineLoading?: boolean
  showMenu: boolean
  menuRef: RefObject<HTMLDivElement | null>
  buttonRef: RefObject<HTMLButtonElement | null>
  firstMenuItemRef: RefObject<HTMLButtonElement | null>
  onSetShowMenu: (show: boolean) => void
  onMessage: () => void
  onFollow: () => void
  onAccept?: () => void
  onDecline?: () => void
  onCancelRequest?: () => void
  onUnblock: () => void
  onEditProfile: () => void
  onShowUnfollowConfirm: () => void
  onShowBlockConfirm: () => void
}

export const ActionBar = ({
  profile,
  isOwnProfile,
  loading,
  acceptLoading = false,
  declineLoading = false,
  showMenu,
  menuRef,
  buttonRef,
  firstMenuItemRef,
  onSetShowMenu,
  onMessage,
  onFollow,
  onAccept,
  onDecline,
  onCancelRequest,
  onUnblock,
  onEditProfile,
  onShowUnfollowConfirm,
  onShowBlockConfirm,
}: ActionBarProps) => {
  // Derive relationship state from profile
  const amIFollowing = profile.amIFollowing ?? false
  const isFollowingMe = profile.isFollowingMe ?? false
  const isPendingOutgoing = profile.isPendingOutgoing ?? false
  const isPendingIncoming = profile.isPendingIncoming ?? false
  const isBlocked = profile.relationship_status === 'blocked'

  // Own profile - Edit button
  if (isOwnProfile) {
    return (
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={onEditProfile}
          className="flex-1 flex items-center justify-center gap-2"
          aria-label="Edit your profile"
        >
          Edit Profile
        </Button>
      </div>
    )
  }

  // Blocked - Unblock button
  if (isBlocked) {
    return (
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={onUnblock}
          isLoading={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600"
          aria-label="Unblock user"
        >
          Unblock
        </Button>
      </div>
    )
  }

  // I follow them
  if (amIFollowing) {
    return (
      <FollowingActions
        profile={profile}
        loading={loading}
        showMenu={showMenu}
        menuRef={menuRef}
        buttonRef={buttonRef}
        firstMenuItemRef={firstMenuItemRef}
        onSetShowMenu={onSetShowMenu}
        onMessage={onMessage}
        onShowUnfollowConfirm={onShowUnfollowConfirm}
        onShowBlockConfirm={onShowBlockConfirm}
      />
    )
  }

  // I sent a request (pending outgoing)
  if (isPendingOutgoing) {
    return (
      <PendingActions
        profile={profile}
        loading={loading}
        onCancelRequest={onCancelRequest}
        onMessage={onMessage}
      />
    )
  }

  // They sent me a request (pending incoming)
  if (isPendingIncoming) {
    return (
      <IncomingRequestActions
        profile={profile}
        loading={loading}
        acceptLoading={acceptLoading}
        declineLoading={declineLoading}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
  }

  // They follow me, but I don't follow them
  if (isFollowingMe && !amIFollowing) {
    return (
      <FollowBackActions
        profile={profile}
        loading={loading}
        onFollow={onFollow}
        onMessage={onMessage}
      />
    )
  }

  // No relationship - Follow button
  return (
    <FollowActions
      profile={profile}
      loading={loading}
      onFollow={onFollow}
      onMessage={onMessage}
    />
  )
}
