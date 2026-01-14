/**
 * ActivityPage Component
 * 
 * Main activity page with tabs for Requests and Notifications
 * Uses single hook instance shared with RequestsPanel for real-time sync
 * 
 * Mobile-first design with:
 * - Full-width tabs on mobile
 * - 48px minimum touch targets
 * - Safe area padding for notched devices
 * - Smooth scrolling with momentum
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, UserPlus } from 'lucide-react'
import { useActivityRequests } from '@/hooks/activity'
import { RequestsPanel } from './components/RequestsPanel'
import { NotificationsPanel } from './components/NotificationsPanel'

type TabType = 'requests' | 'notifications'

export const ActivityPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('requests')

  // Single hook instance - shared with RequestsPanel for real-time sync
  const activityData = useActivityRequests({ enabled: true })
  const requestCount = activityData.requests.length

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header - Sticky on mobile */}
      <div className="flex-none px-3 pt-3 pb-2 sm:px-6 sm:pt-6 sm:pb-4 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-3 sm:mb-6">
          Activity
        </h1>

        {/* Tabs - Full width on mobile for better touch */}
        <div
          className="flex gap-2"
          role="tablist"
          aria-label="Activity tabs"
        >
          <button
            onClick={() => setActiveTab('requests')}
            role="tab"
            aria-selected={activeTab === 'requests'}
            aria-controls="requests-panel"
            id="requests-tab"
            className={`
              flex-1 px-3 py-3 rounded-xl font-semibold text-sm 
              transition-all duration-200 
              flex items-center justify-center gap-2 
              min-h-[52px] 
              active:scale-[0.98] touch-manipulation
              ${activeTab === 'requests'
                ? 'bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/90 border border-gray-200/80 text-gray-700 hover:bg-white active:bg-gray-50'
              }
            `}
          >
            <UserPlus size={20} className="flex-shrink-0" />
            <span>Requests</span>
            {requestCount > 0 && (
              <span
                className={`
                  ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                  ${activeTab === 'requests' ? 'bg-white/25' : 'bg-purple-100 text-purple-600'}
                `}
                aria-label={`${requestCount} pending requests`}
              >
                {requestCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            role="tab"
            aria-selected={activeTab === 'notifications'}
            aria-controls="notifications-panel"
            id="notifications-tab"
            className={`
              flex-1 px-3 py-3 rounded-xl font-semibold text-sm 
              transition-all duration-200 
              flex items-center justify-center gap-2 
              min-h-[52px] 
              active:scale-[0.98] touch-manipulation
              ${activeTab === 'notifications'
                ? 'bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/90 border border-gray-200/80 text-gray-700 hover:bg-white active:bg-gray-50'
              }
            `}
          >
            <Bell size={20} className="flex-shrink-0" />
            <span>Notifications</span>
          </button>
        </div>
      </div>

      {/* Content - Scrollable area with momentum scrolling */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-6 sm:px-6 sm:pb-8 -webkit-overflow-scrolling-touch">
        <AnimatePresence mode="wait">
          {activeTab === 'requests' ? (
            <motion.div
              key="requests"
              id="requests-panel"
              role="tabpanel"
              aria-labelledby="requests-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="pt-3"
            >
              <RequestsPanel activityData={activityData} />
            </motion.div>
          ) : (
            <motion.div
              key="notifications"
              id="notifications-panel"
              role="tabpanel"
              aria-labelledby="notifications-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="pt-3"
            >
              <NotificationsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
