import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthListener } from './hooks/useAuthListener'
import { ProtectedRoute, PublicRoute } from './components/routing'
import { DashboardLayout } from './components/layout'
import { ChatLayout } from './pages/chat'
import { ChatWindow } from './components/features/ChatWindow'
import { ToastContainer } from './components/ui/Toast'
import LoginPage from './app/(auth)/login/page'
import SignupPage from './app/(auth)/signup/page'
import { DashboardPage } from './pages/dashboard'
import { ProfilePage } from './pages/profile'

// Auth wrapper to initialize auth listener
function AuthWrapper({ children }: { children: React.ReactNode }) {
  useAuthListener()
  return <>{children}</>
}

function App() {
  return (
    <>
      {/* Global Toast Notification Container - Must be outside Router for global access */}
      <ToastContainer />
      <Router>
        <AuthWrapper>
          <Routes>
          {/* Public routes - redirect to dashboard if logged in */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          {/* Protected routes - redirect to login if not authenticated */}
          {/* Main Chat Route - Root path */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatLayout>
                  <ChatWindow />
                </ChatLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthWrapper>
      </Router>
    </>
  )
}

export default App
