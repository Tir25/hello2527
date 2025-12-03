import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const STORAGE_KEY = 'heloo-auth'

const customFetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
  let urlString: string

  if (typeof url === 'string') {
    urlString = url
  } else if (url instanceof URL) {
    urlString = url.toString()
  } else if (url instanceof Request) {
    urlString = url.url
  } else {
    urlString = String(url)
  }

  const isAuthEndpoint = urlString.includes('/auth/v1/token') || urlString.includes('/auth/v1/verify')
  const isRefreshTokenRequest = 
    urlString.includes('grant_type=refresh_token') ||
    (options?.body && typeof options.body === 'string' && options.body.includes('refresh_token'))

  let response: Response

  if (import.meta.env.DEV && urlString.includes(supabaseUrl)) {
    const proxyUrl = urlString.replace(supabaseUrl, '/supabase')
    response = await fetch(proxyUrl, {
      ...options,
      credentials: 'include',
    })
  } else {
    response = await fetch(url, {
      ...options,
      credentials: 'omit',
    })
  }

  if (isAuthEndpoint && isRefreshTokenRequest && response.status === 400) {
    try {
      const clonedResponse = response.clone()
      const responseData = await clonedResponse.json().catch(() => ({}))
      const errorMessage = responseData?.error_description || responseData?.error || ''
      
      if (
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('JWT expired')
      ) {
        logger.warn('supabase:customFetch', 'Invalid refresh token detected in API response, clearing tokens')
        clearInvalidAuthTokens()
        supabase.auth.signOut().catch(() => {
          logger.error('supabase:customFetch', 'Failed to sign out after invalid token detection')
        })
      }
    } catch {
      if (response.status === 400) {
        logger.warn('supabase:customFetch', '400 error on token refresh endpoint, clearing tokens as precaution')
        clearInvalidAuthTokens()
      }
    }
  }

  return response
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: STORAGE_KEY,
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
})

export const clearInvalidAuthTokens = (): void => {
  try {
    const storage = window.localStorage
    const authData = storage.getItem(STORAGE_KEY)
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        if (parsed && typeof parsed === 'object') {
          storage.removeItem(STORAGE_KEY)
          logger.info('supabase:clearInvalidTokens', 'Cleared invalid auth tokens from storage')
        }
      } catch {
        storage.removeItem(STORAGE_KEY)
        logger.info('supabase:clearInvalidTokens', 'Cleared corrupted auth data from storage')
      }
    }
  } catch (error) {
    logger.error('supabase:clearInvalidTokens', 'Failed to clear invalid tokens', error)
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    logger.warn('supabase:authStateChange', 'Token refresh resulted in null session, clearing invalid tokens')
    clearInvalidAuthTokens()
  }
})

