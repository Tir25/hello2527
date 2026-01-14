/**
 * RequestsPanel Component
 * 
 * Displays pending connection requests with time-based sections
 * Receives data from parent to share state with badge counter
 */

import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Inbox, UserCheck } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { groupByTime, type TimeSection, type UseActivityRequestsResult } from '@/hooks/activity'
import { RequestItem } from './RequestItem'
import { FollowBackItem } from './FollowBackItem'
import { TimeSectionHeader } from './TimeSectionHeader'

const SECTION_ORDER: TimeSection[] = ['today', 'thisWeek', 'earlier']

interface RequestsPanelProps {
    activityData: UseActivityRequestsResult
}

export const RequestsPanel = ({ activityData }: RequestsPanelProps) => {
    const navigate = useNavigate()

    const {
        requests,
        loading,
        processingIds,
        acceptedRequests,
        followingBackIds,
        handleAccept,
        handleDecline,
        handleFollowBack,
        handleDismissFollowBack,
        getDisplayName,
        getProfileFromRequest,
    } = activityData

    const handleViewProfile = (userId: string, username?: string | null) => {
        // Use username for clean URLs, fallback to ID
        navigate(`/profile/${username || userId}`)
    }

    // Group requests by time
    const groupedRequests = groupByTime(requests)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading requests...</p>
                </div>
            </div>
        )
    }

    if (requests.length === 0 && acceptedRequests.length === 0) {
        return (
            <GlassCard className="p-6 sm:p-12 text-center">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-2 sm:mb-4">
                        <Inbox size={40} className="text-gray-400 sm:hidden" />
                        <Inbox size={48} className="text-gray-400 hidden sm:block" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">No pending requests</h3>
                    <p className="text-sm sm:text-base text-gray-500 max-w-md">
                        When someone sends you a connection request, it will appear here.
                    </p>
                </div>
            </GlassCard>
        )
    }

    return (
        <div className="space-y-4">
            {/* Time-grouped requests */}
            {SECTION_ORDER.map(section => {
                const sectionRequests = groupedRequests[section]
                if (sectionRequests.length === 0) return null

                return (
                    <div key={section}>
                        <TimeSectionHeader section={section} count={sectionRequests.length} />
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-3">
                                {sectionRequests.map((request) => (
                                    <RequestItem
                                        key={request.relationship_id}
                                        request={request}
                                        isProcessing={processingIds.has(request.relationship_id)}
                                        onAccept={() => handleAccept(request)}
                                        onDecline={() => handleDecline(request)}
                                        onViewProfile={() => handleViewProfile(request.requester_id, getProfileFromRequest(request)?.username)}
                                        displayName={getDisplayName(request)}
                                        profile={getProfileFromRequest(request)}
                                        showTime
                                    />
                                ))}
                            </div>
                        </AnimatePresence>
                    </div>
                )
            })}

            {/* Follow Back Section */}
            {acceptedRequests.length > 0 && (
                <div className="mt-4 sm:mt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                        <UserCheck size={18} className="text-purple-500 sm:hidden" />
                        <UserCheck size={20} className="text-purple-500 hidden sm:block" />
                        Follow Back
                    </h3>
                    <div className="space-y-3">
                        {acceptedRequests.map((request) => (
                            <FollowBackItem
                                key={`followback-${request.requester_id}`}
                                request={request}
                                isFollowingBack={followingBackIds.has(request.requester_id)}
                                onFollowBack={() => handleFollowBack(request)}
                                onDismiss={() => handleDismissFollowBack(request.requester_id)}
                                onViewProfile={() => handleViewProfile(request.requester_id, getProfileFromRequest(request)?.username)}
                                displayName={getDisplayName(request)}
                                profile={getProfileFromRequest(request)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
