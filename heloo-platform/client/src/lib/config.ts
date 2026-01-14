/**
 * Environment Configuration
 * 
 * Centralized configuration for environment variables with validation and fallbacks.
 * This ensures proper configuration in both development and production environments.
 */

const isDevelopment = import.meta.env.MODE === 'development'
const isProduction = import.meta.env.MODE === 'production'

/**
 * Get the API URL with proper fallback handling
 * 
 * In production, this MUST be set via environment variable.
 * Falls back to localhost only in development mode.
 */
export const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL

  // Production mode: Require explicit API URL
  if (isProduction) {
    if (!apiUrl) {
      const errorMessage = `
🚨 CRITICAL: VITE_API_URL is not set in production!

Socket.io connections will fail because the API URL defaults to localhost:5000,
which doesn't exist in production.

To fix this:
1. Set VITE_API_URL environment variable in your deployment platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables  
   - Cloudflare Pages: Settings → Environment Variables
   - Other: Set in your CI/CD pipeline or hosting platform

2. Example value: https://your-backend-domain.com

Current mode: ${import.meta.env.MODE}
`
      console.error(errorMessage)

      // Still return localhost as fallback, but log the error
      // This allows the app to load, but socket will fail (which is expected)
      return 'http://localhost:5001'
    }

    // Validate production URL format
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      console.warn(`⚠️ VITE_API_URL should start with http:// or https://. Got: ${apiUrl}`)
    }

    return apiUrl
  }

  // Development mode: Default to localhost
  return apiUrl || 'http://localhost:5001'
}

/**
 * Supabase configuration
 */
export const config = {
  // API Configuration
  apiUrl: getApiUrl(),

  // Supabase Configuration
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',

  // Environment Info
  isDevelopment,
  isProduction,
  mode: import.meta.env.MODE,

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.supabaseUrl) {
      errors.push('VITE_SUPABASE_URL is not set')
    }

    if (!this.supabaseAnonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY is not set')
    }

    if (isProduction && !import.meta.env.VITE_API_URL) {
      errors.push('VITE_API_URL is not set (required in production)')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },
}

// Log configuration status on module load (development only)
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    mode: config.mode,
    apiUrl: config.apiUrl,
    supabaseUrl: config.supabaseUrl ? '✅ Set' : '❌ Missing',
    supabaseAnonKey: config.supabaseAnonKey ? '✅ Set' : '❌ Missing',
  })
}

// Validate configuration and warn in production
if (isProduction) {
  const validation = config.validate()
  if (!validation.isValid) {
    console.error('🚨 Configuration Validation Failed:', validation.errors)
    console.error('This may cause runtime errors. Please set the required environment variables.')
  }
}

