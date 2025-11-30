import React from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
        {/* Subtle background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />
        
        {/* Glass spinner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 backdrop-blur-xl bg-white/70 rounded-2xl p-8 border border-white/20 shadow-xl"
        >
          <div className="w-12 h-12 border-4 border-gray-200/50 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-700 text-lg font-medium">Loading...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

