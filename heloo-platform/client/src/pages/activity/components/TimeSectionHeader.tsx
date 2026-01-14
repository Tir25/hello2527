/**
 * TimeSectionHeader Component
 * 
 * Displays section headers for time-grouped notifications (Today, This Week, Earlier)
 * Compact design optimized for mobile
 */

import { Clock, CalendarDays, History } from 'lucide-react'
import type { TimeSection } from '@/hooks/activity/notificationUtils'

interface TimeSectionHeaderProps {
    section: TimeSection
    count: number
}

const sectionConfig = {
    today: {
        label: 'Today',
        icon: Clock,
        gradient: 'from-green-500 to-emerald-500',
        bg: 'bg-green-500',
    },
    thisWeek: {
        label: 'This Week',
        icon: CalendarDays,
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-500',
    },
    earlier: {
        label: 'Earlier',
        icon: History,
        gradient: 'from-gray-500 to-slate-500',
        bg: 'bg-gray-500',
    },
}

export const TimeSectionHeader = ({ section, count }: TimeSectionHeaderProps) => {
    const config = sectionConfig[section]
    const Icon = config.icon

    return (
        <div className="flex items-center gap-2 mb-2 mt-1">
            <div className={`
                flex items-center gap-1.5 
                px-2.5 py-1 rounded-full 
                bg-gradient-to-r ${config.gradient} 
                text-white text-[13px] font-medium 
                shadow-sm
            `}>
                <Icon size={12} />
                <span>{config.label}</span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">
                {count}
            </span>
        </div>
    )
}
