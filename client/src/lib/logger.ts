type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  context: string
  message: string
  error?: Error | unknown
  metadata?: Record<string, unknown>
  timestamp: string
}

class Logger {
  /**
   * Safely stringify metadata objects for logging
   * Handles circular references and large objects
   */
  private stringifyMetadata(metadata: unknown): string {
    if (metadata === null || metadata === undefined) {
      return ''
    }

    // Create a new WeakSet for each stringification to track circular references
    const seen = new WeakSet<object>()

    try {
      // Handle Error objects specially
      if (metadata instanceof Error) {
        return `${metadata.name}: ${metadata.message}${metadata.stack ? `\n${metadata.stack}` : ''}`
      }

      // Handle plain objects and arrays
      if (typeof metadata === 'object') {
        // Use JSON.stringify with replacer to handle circular references
        return JSON.stringify(metadata, (_key, value) => {
          // Skip circular references
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular]'
            }
            seen.add(value)
          }
          return value
        }, 2)
      }

      return String(metadata)
    } catch (error) {
      return `[Unable to stringify: ${error instanceof Error ? error.message : String(error)}]`
    }
  }

  private formatMessage(entry: LogEntry): string {
    const { level, context, message, error, metadata, timestamp } = entry
    const time = new Date(timestamp).toISOString()
    let baseMessage = `[${time}] [${level.toUpperCase()}] [${context}] ${message}`

    // Add metadata if present
    if (metadata && Object.keys(metadata).length > 0) {
      const metadataStr = this.stringifyMetadata(metadata)
      if (metadataStr) {
        baseMessage += `\n${metadataStr}`
      }
    }

    // Add error details if present
    if (error) {
      const errorDetails =
        error instanceof Error
          ? `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`
          : this.stringifyMetadata(error)
      baseMessage += `\n${errorDetails}`
    }

    return baseMessage
  }

  private log(
    level: LogLevel,
    context: string,
    message: string,
    errorOrMetadata?: Error | unknown | Record<string, unknown>
  ) {
    // Determine if the third parameter is an error, metadata object, or neither
    let error: Error | unknown | undefined
    let metadata: Record<string, unknown> | undefined

    if (errorOrMetadata) {
      if (errorOrMetadata instanceof Error) {
        error = errorOrMetadata
      } else if (typeof errorOrMetadata === 'object' && errorOrMetadata !== null && !Array.isArray(errorOrMetadata)) {
        // Check if it looks like an error object (has message and/or stack)
        if ('message' in errorOrMetadata || 'stack' in errorOrMetadata) {
          error = errorOrMetadata
        } else {
          // Treat as metadata object
          metadata = errorOrMetadata as Record<string, unknown>
        }
      } else {
        error = errorOrMetadata
      }
    }

    const entry: LogEntry = {
      level,
      context,
      message,
      error,
      metadata,
      timestamp: new Date().toISOString(),
    }

    const formattedMessage = this.formatMessage(entry)

    switch (level) {
      case 'error':
        console.error(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'debug':
        if (import.meta.env.DEV) {
          console.debug(formattedMessage)
        }
        break
      default:
        console.log(formattedMessage)
    }
  }

  info(context: string, message: string, metadataOrError?: Record<string, unknown> | Error | unknown) {
    this.log('info', context, message, metadataOrError)
  }

  warn(context: string, message: string, metadataOrError?: Record<string, unknown> | Error | unknown) {
    this.log('warn', context, message, metadataOrError)
  }

  error(context: string, message: string, metadataOrError?: Record<string, unknown> | Error | unknown) {
    this.log('error', context, message, metadataOrError)
  }

  debug(context: string, message: string, metadata?: Record<string, unknown>) {
    this.log('debug', context, message, metadata)
  }
}

export const logger = new Logger()

