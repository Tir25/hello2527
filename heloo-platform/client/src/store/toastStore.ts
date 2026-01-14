import { create } from 'zustand'
import type { ToastType } from '@/components/ui/Toast'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

let toastIdCounter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  showToast: (message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${Date.now()}-${++toastIdCounter}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  success: (message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${++toastIdCounter}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type: 'success', duration }],
    }))
  },

  error: (message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${++toastIdCounter}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type: 'error', duration }],
    }))
  },

  info: (message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${++toastIdCounter}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type: 'info', duration }],
    }))
  },

  warning: (message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${++toastIdCounter}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type: 'warning', duration }],
    }))
  },
}))

// Convenience function for easier imports
export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().success(message, duration),
  error: (message: string, duration?: number) => useToastStore.getState().error(message, duration),
  info: (message: string, duration?: number) => useToastStore.getState().info(message, duration),
  warning: (message: string, duration?: number) => useToastStore.getState().warning(message, duration),
}

