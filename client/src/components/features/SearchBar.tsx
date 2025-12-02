import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search users...',
  className,
}: SearchBarProps) => {
  return (
    <motion.div
      className={cn('relative', className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-12 pr-4 py-3 rounded-full',
            'bg-white/40 backdrop-blur-md',
            'border border-white/30',
            'text-gray-800 placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
            'focus:border-purple-400/50',
            'focus:bg-white/60',
            'transition-all duration-300',
            'shadow-sm hover:shadow-md focus:shadow-lg focus:shadow-purple-500/30'
          )}
        />
      </div>
    </motion.div>
  )
}

