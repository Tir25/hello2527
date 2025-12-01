import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom fetch function that routes through Vite proxy in development
// This fixes the cookie domain issue by making requests appear to come from localhost
const customFetch = (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
  // In development, route Supabase requests through the Vite proxy
  if (import.meta.env.DEV) {
    let urlString: string
    
    // Handle different URL types
    if (typeof url === 'string') {
      urlString = url
    } else if (url instanceof URL) {
      urlString = url.toString()
    } else if (url instanceof Request) {
      urlString = url.url
    } else {
      urlString = String(url)
    }
    
    // If this is a Supabase request, route it through the proxy
    if (urlString.includes(supabaseUrl)) {
      const proxyUrl = urlString.replace(supabaseUrl, '/supabase')
      return fetch(proxyUrl, {
        ...options,
        credentials: 'include',
      })
    }
  }
  
  // In production or for non-Supabase URLs, use normal fetch
  return fetch(url, {
    ...options,
    credentials: 'include',
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'heloo-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
})
