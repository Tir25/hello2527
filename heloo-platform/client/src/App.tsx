/**
 * App.tsx - Main Application Router
 * 
 * Uses React.lazy() for code splitting on route-level components.
 * This improves initial load performance.
 */

import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './components/routing'
import { DashboardLayout } from './components/layout'
import RootLayout from './app/layout'

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./app/(auth)/login/page'))
const RegisterPage = lazy(() => import('./app/(auth)/register/page'))
const ChatPage = lazy(() => import('./app/(dashboard)/chat/page'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ActivityPage = lazy(() => import('./pages/activity/ActivityPage').then(m => ({ default: m.ActivityPage })))
const SearchPage = lazy(() => import('./pages/search/SearchPage').then(m => ({ default: m.SearchPage })))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const PrivacySettingsPage = lazy(() => import('./pages/settings/PrivacySettings').then(m => ({ default: m.PrivacySettingsPage })))
const StorySettingsPage = lazy(() => import('./pages/settings/StorySettings').then(m => ({ default: m.StorySettingsPage })))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-cyan-900">
      <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
    </div>
    <div className="relative z-10">
      <div className="w-12 h-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <RootLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ChatPage />
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
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ActivityPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SearchPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/privacy"
              element={
                <ProtectedRoute>
                  <PrivacySettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/story"
              element={
                <ProtectedRoute>
                  <StorySettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RootLayout>
    </Router>
  )
}

export default App
