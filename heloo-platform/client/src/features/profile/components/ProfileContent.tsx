/**
 * ProfileContent Component
 * 
 * Responsibility: Display profile content with tabs (Posts, About, Settings)
 * Layer: UI (Dumb Component)
 * 
 * Features:
 * - Tab navigation (Posts, About, Settings for own profile)
 * - Empty states with illustrations
 * - Settings tab with privacy controls and logout
 * - Future-ready for media grid
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Info, Grid } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { EmptyState } from './EmptyState'
import type { Profile } from '../types/profile.types'

interface ProfileContentProps {
  profile: Profile
  isOwnProfile: boolean
}

type TabType = 'posts' | 'about'

interface TabItem {
  id: TabType
  label: string
  shortLabel: string  // Short label for mobile
  icon: React.ReactNode
  ownProfileOnly?: boolean
}

const tabs: TabItem[] = [
  { id: 'posts', label: 'Posts', shortLabel: 'Posts', icon: <Grid size={18} /> },
  { id: 'about', label: 'About', shortLabel: 'Info', icon: <Info size={18} /> },
]

export const ProfileContent = ({ profile, isOwnProfile }: ProfileContentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('posts')

  // Filter tabs based on whether viewing own profile
  const visibleTabs = tabs.filter(tab => !tab.ownProfileOnly || isOwnProfile)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Tab Navigation - Accessible with proper ARIA roles */}
      <div
        role="tablist"
        aria-label="Profile content tabs"
        className="flex justify-center gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100"
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all
              min-w-[80px] sm:min-w-0
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            role="tab"
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.icon}
            {/* Show short label on mobile, full label on larger screens */}
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content - With proper panel roles and FAB clearance padding */}
      <GlassCard variant="default" className="p-4 sm:p-6 pb-20 sm:pb-24 bg-white/90 border-gray-200 shadow-lg min-h-[200px]">
        {activeTab === 'posts' && (
          <div
            id="tabpanel-posts"
            role="tabpanel"
            aria-labelledby="tab-posts"
            tabIndex={0}
          >
            <PostsTab isOwnProfile={isOwnProfile} />
          </div>
        )}

        {activeTab === 'about' && (
          <div
            id="tabpanel-about"
            role="tabpanel"
            aria-labelledby="tab-about"
            tabIndex={0}
          >
            <AboutTab profile={profile} isOwnProfile={isOwnProfile} />
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}

/**
 * Posts Tab Content
 */
const PostsTab = ({ isOwnProfile }: { isOwnProfile: boolean }) => {
  // Future: Fetch actual posts from posts service
  const posts: unknown[] = []

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon size={32} />}
        title={isOwnProfile ? "Share your first post" : "No posts yet"}
        description={
          isOwnProfile
            ? "Your posts will appear here. Share photos and moments with your connections."
            : "This user hasn't shared any posts yet."
        }
      // Note: Action button removed until post creation feature is implemented
      />
    )
  }

  // Future: Render posts grid
  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Posts will render here */}
    </div>
  )
}

/**
 * About Tab Content
 */
const AboutTab = ({ profile, isOwnProfile }: { profile: Profile; isOwnProfile: boolean }) => {
  const hasInfo = profile.email || profile.phone || profile.created_at

  if (!hasInfo && !isOwnProfile) {
    return (
      <EmptyState
        icon={<Info size={32} />}
        title="No information available"
        description="This user hasn't added any profile information yet."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Only show contact info for own profile */}
      {isOwnProfile && (
        <>
          {profile.email && (
            <InfoRow label="Email" value={profile.email} />
          )}
          {profile.phone && (
            <InfoRow label="Phone" value={profile.phone} />
          )}
        </>
      )}

      {profile.created_at && (
        <InfoRow
          label="Member since"
          value={new Date(profile.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        />
      )}
    </div>
  )
}

/**
 * Information Row
 */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <span className="text-sm text-gray-800">{value}</span>
  </div>
)

