import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/services/profile.service'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  profileLoading: boolean
  profileError: string | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setProfileLoading: (loading: boolean) => void
  setProfileError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearAuth: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  profileLoading: false,
  profileError: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setProfileLoading: (loading) => set({ profileLoading: loading }),
  setProfileError: (error) => set({ profileError: error }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ 
    user: null, 
    session: null, 
    profile: null,
    profileLoading: false,
    profileError: null,
    loading: false, 
    error: null 
  }),
  clearError: () => set({ error: null }),
}))
