import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-500 to-cyan-400 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="block mb-8 text-center">
          <motion.h1
            whileHover={{ scale: 1.05 }}
            className="text-4xl font-bold text-white drop-shadow-lg"
          >
            He'loo
          </motion.h1>
        </Link>

        {/* Glass card container */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8">
          {title && (
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-white/80 text-sm sm:text-base text-center mb-6">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </motion.div>
    </div>
  )
}

