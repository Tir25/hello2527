/**
 * Suppress harmless console warnings that don't affect functionality
 * 
 * This utility filters out known browser warnings that are expected
 * in development environments, particularly when using services
 * behind Cloudflare (like Supabase).
 */

/**
 * Suppress Cloudflare bot management cookie warnings
 * 
 * The __cf_bm cookie is set by Cloudflare's bot management system.
 * In development (localhost), this cookie warning is harmless and expected
 * when making requests to Supabase (which uses Cloudflare).
 */
export const suppressCloudflareCookieWarnings = () => {
  if (typeof window === 'undefined') return

  const originalWarn = console.warn
  const originalError = console.error

  // Filter out Cloudflare cookie warnings
  const filterCloudflareCookieWarning = (args: unknown[]): boolean => {
    const message = args[0]?.toString() || ''
    
    // Check if it's the Cloudflare cookie warning
    if (
      message.includes('__cf_bm') ||
      (message.includes('Cookie') && message.includes('rejected') && message.includes('invalid domain'))
    ) {
      // Suppress this specific warning - it's harmless in development
      return true
    }
    
    return false
  }

  // Override console.warn
  console.warn = (...args: unknown[]): void => {
    if (!filterCloudflareCookieWarning(args)) {
      originalWarn.apply(console, args)
    }
  }

  // Override console.error
  console.error = (...args: unknown[]): void => {
    if (!filterCloudflareCookieWarning(args)) {
      originalError.apply(console, args)
    }
  }

  // Return cleanup function
  return () => {
    console.warn = originalWarn
    console.error = originalError
  }
}

/**
 * Initialize console warning suppression
 * Call this once in your app initialization
 */
export const initConsoleWarningSuppression = () => {
  // Only suppress in development
  if (import.meta.env.DEV) {
    suppressCloudflareCookieWarnings()
  }
}

