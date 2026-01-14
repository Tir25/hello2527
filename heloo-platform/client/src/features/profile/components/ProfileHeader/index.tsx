/**
 * ProfileHeader Component (Refactored)
 * 
 * Responsibility: Assemble ProfileHeader sub-components
 * Layer: UI (Container Component)
 * 
 * Logic is in useProfileHeader hook
 * UI is split into: AvatarSection, StatsRow, BioSection, ActionBar, ConfirmDialog
 */

import { useState } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import { useProfileHeader } from '../../hooks/useProfileHeader'
import { AvatarSection } from './AvatarSection'
import { StatsRow } from './StatsRow'
import { BioSection } from './BioSection'
import { ActionBar } from './ActionBar'
import { ConfirmDialog } from './ConfirmDialog'
import { ConnectionsModal } from '../ConnectionsModal'
import { EditProfileModal } from '../EditProfileModal'
import type { ProfileHeaderProps } from '../../types/profile.types'

type ConnectionTab = 'followers' | 'following'

export const ProfileHeader = ({ profile, isOwnProfile, onProfileUpdate }: ProfileHeaderProps) => {
  const {
    // State
    loading,
    acceptLoading,
    declineLoading,
    showMenu,
    confirmDialog,

    // Derived
    isPrivate,
    isOnline,
    stats,
    statsLoading,

    // Refs
    menuRef,
    buttonRef,
    firstMenuItemRef,
    dialogRef,
    cancelButtonRef,
    confirmButtonRef,

    // Actions
    setShowMenu,
    handleMessage,
    handleFollow,
    handleAcceptRequest,
    handleDeclineRequest,
    handleCancelRequest,
    handleUnblock,
    showUnfollowConfirm,
    showBlockConfirm,
    closeConfirmDialog,
  } = useProfileHeader({ profile, isOwnProfile, onProfileUpdate })

  // Connections modal state
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false)
  const [connectionsTab, setConnectionsTab] = useState<ConnectionTab>('followers')

  // Edit profile modal state (replaces the navigate-to-nowhere handler)
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)

  const handleFollowersClick = () => {
    setConnectionsTab('followers')
    setConnectionsModalOpen(true)
  }

  const handleFollowingClick = () => {
    setConnectionsTab('following')
    setConnectionsModalOpen(true)
  }

  // Open edit profile modal instead of navigating
  const handleOpenEditProfile = () => {
    setEditProfileModalOpen(true)
  }

  return (
    <>
      <GlassCard variant="elevated" className="relative z-20 p-4 sm:p-6 md:p-8 bg-white/90 border-gray-200 shadow-xl">
        <AvatarSection
          profile={profile}
          isOnline={isOnline}
          isOwnProfile={isOwnProfile}
        />

        <StatsRow
          stats={stats}
          isLoading={statsLoading}
          onFollowersClick={handleFollowersClick}
          onFollowingClick={handleFollowingClick}
        />

        <BioSection profile={profile} isPrivate={isPrivate} />

        <ActionBar
          profile={profile}
          isOwnProfile={isOwnProfile}
          loading={loading}
          acceptLoading={acceptLoading}
          declineLoading={declineLoading}
          showMenu={showMenu}
          menuRef={menuRef}
          buttonRef={buttonRef}
          firstMenuItemRef={firstMenuItemRef}
          onSetShowMenu={setShowMenu}
          onMessage={handleMessage}
          onFollow={handleFollow}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
          onCancelRequest={handleCancelRequest}
          onUnblock={handleUnblock}
          onEditProfile={handleOpenEditProfile}
          onShowUnfollowConfirm={showUnfollowConfirm}
          onShowBlockConfirm={showBlockConfirm}
        />
      </GlassCard>

      {confirmDialog && (
        <ConfirmDialog
          dialog={confirmDialog}
          loading={loading}
          dialogRef={dialogRef}
          cancelButtonRef={cancelButtonRef}
          confirmButtonRef={confirmButtonRef}
          onClose={closeConfirmDialog}
        />
      )}

      <ConnectionsModal
        isOpen={connectionsModalOpen}
        onClose={() => setConnectionsModalOpen(false)}
        userId={profile.id}
        initialTab={connectionsTab}
        followersCount={stats.followers}
        followingCount={stats.following}
      />

      {/* Edit Profile Modal - only for own profile */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={editProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          profile={profile}
          onUpdate={onProfileUpdate || (() => { })}
        />
      )}
    </>
  )
}
