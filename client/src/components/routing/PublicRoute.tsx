import React from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

interface PublicRouteProps {
  children: React.ReactNode
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-900 via-purple-900 to-cyan-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-white/80 text-lg">Loading...</p>
        </motion.div>
      </div>
    )
  }

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

