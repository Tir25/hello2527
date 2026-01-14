/**
 * useProfileHeader Hook (Refactored)
 * 
 * Responsibility: Orchestrate ProfileHeader state and UI
 * Layer: Hook (Logic)
 * 
 * Max lines: ~150
 * 
 * Action handlers are in useProfileActions.ts
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useProfileActions } from './useProfileActions'
import { profileStatsService } from '../services/profile-stats.service'
import type { Profile, ConfirmDialogState, ProfileStats } from '../types/profile.types'

interface UseProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  onProfileUpdate?: () => void
}

export const useProfileHeader = ({ profile, isOwnProfile, onProfileUpdate }: UseProfileHeaderProps) => {
  const { user } = useAuthStore()
  const { isUserOnline } = useChatStore()

  // Use extracted actions hook
  const actions = useProfileActions({
    profile,
    userId: user?.id,
    onProfileUpdate
  })

  // UI states
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)

  // Refs for menu/dialog focus management
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Derived state
  const relationshipStatus = profile.relationship_status || 'none'
  const isRequester = profile.is_requester ?? false
  const isPendingIncoming = relationshipStatus === 'pending' && !isRequester
  const isPendingOutgoing = relationshipStatus === 'pending' && isRequester
  const isPrivate = !isOwnProfile && relationshipStatus !== 'accepted'
  // Use socket-based online status instead of last_seen calculation
  const isOnline = !isOwnProfile && isUserOnline(profile.id)

  // Stats state
  const [stats, setStats] = useState<ProfileStats>({
    posts: 0,
    followers: 0,
    following: 0,
    joinedDate: profile.created_at ? new Date(profile.created_at).getFullYear() : null,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const hasStats = stats.posts > 0 || stats.followers > 0 || stats.following > 0

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true)
      const joinedYear = profile.created_at ? new Date(profile.created_at).getFullYear() : null
      const result = await profileStatsService.getStats(profile.id, joinedYear)
      if (result.success && result.data) {
        setStats(result.data)
      }
      setStatsLoading(false)
    }
    fetchStats()
  }, [profile.id, profile.created_at])

  // Click outside handler for menu
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    // Focus first menu item
    setTimeout(() => firstMenuItemRef.current?.focus(), 0)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showMenu])

  // Focus trap for dialog
  useEffect(() => {
    if (!confirmDialog || !dialogRef.current) return

    const dialog = dialogRef.current

    const getFocusableElements = (): HTMLElement[] => {
      const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      return Array.from(dialog.querySelectorAll(selector)) as HTMLElement[]
    }

    setTimeout(() => cancelButtonRef.current?.focus(), 0)

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    dialog.addEventListener('keydown', handleTabKey)
    return () => dialog.removeEventListener('keydown', handleTabKey)
  }, [confirmDialog])

  // Confirm dialog helpers with menu close
  const handleUnfollowWithDialog = useCallback(async () => {
    const success = await actions.handleUnfollow()
    if (success) {
      setConfirmDialog(null)
      setShowMenu(false)
    }
  }, [actions])

  const handleBlockWithDialog = useCallback(async () => {
    const success = await actions.handleBlock()
    if (success) {
      setConfirmDialog(null)
      setShowMenu(false)
    }
  }, [actions])

  const showUnfollowConfirm = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      title: 'Unfollow User?',
      message: `Are you sure you want to unfollow ${profile.full_name || profile.username || 'this user'}? You'll no longer see their posts.`,
      onConfirm: handleUnfollowWithDialog,
      confirmLabel: 'Unfollow',
      variant: 'warning',
    })
    setShowMenu(false)
  }, [profile.full_name, profile.username, handleUnfollowWithDialog])

  const showBlockConfirm = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      title: 'Block User?',
      message: `Are you sure you want to block ${profile.full_name || profile.username || 'this user'}? They won't be able to message you or see your profile.`,
      onConfirm: handleBlockWithDialog,
      confirmLabel: 'Block',
      variant: 'danger',
    })
    setShowMenu(false)
  }, [profile.full_name, profile.username, handleBlockWithDialog])

  const closeConfirmDialog = useCallback(() => {
    if (!actions.loading) setConfirmDialog(null)
  }, [actions.loading])

  return {
    // State
    loading: actions.loading,
    acceptLoading: actions.acceptLoading,
    declineLoading: actions.declineLoading,
    showMenu,
    confirmDialog,

    // Derived
    relationshipStatus,
    isPendingIncoming,
    isPendingOutgoing,
    isPrivate,
    isOnline,
    stats,
    statsLoading,
    hasStats,

    // Refs
    menuRef,
    buttonRef,
    firstMenuItemRef,
    dialogRef,
    cancelButtonRef,
    confirmButtonRef,

    // Actions
    setShowMenu,
    handleMessage: actions.handleMessage,
    handleFollow: actions.handleFollow,
    handleAcceptRequest: actions.handleAcceptRequest,
    handleDeclineRequest: actions.handleDeclineRequest,
    handleUnfollow: actions.handleUnfollow,
    handleUnblock: actions.handleUnblock,
    handleCancelRequest: actions.handleCancelRequest,
    handleEditProfile: actions.handleEditProfile,
    showUnfollowConfirm,
    showBlockConfirm,
    closeConfirmDialog,
  }
}
