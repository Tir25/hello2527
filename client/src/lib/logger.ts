type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  context: string
  message: string
  error?: Error | unknown
  timestamp: string
}

class Logger {
  private formatMessage(entry: LogEntry): string {
    const { level, context, message, error, timestamp } = entry
    const time = new Date(timestamp).toISOString()
    const baseMessage = `[${time}] [${level.toUpperCase()}] [${context}] ${message}`

    if (error) {
      const errorDetails =
        error instanceof Error
          ? `${error.name}: ${error.message}\n${error.stack}`
          : String(error)
      return `${baseMessage}\n${errorDetails}`
    }

    return baseMessage
  }

  private log(level: LogLevel, context: string, message: string, error?: Error | unknown) {
    const entry: LogEntry = {
      level,
      context,
      message,
      error,
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

  info(context: string, message: string) {
    this.log('info', context, message)
  }

  warn(context: string, message: string) {
    this.log('warn', context, message)
  }

  error(context: string, message: string, error?: Error | unknown) {
    this.log('error', context, message, error)
  }

  debug(context: string, message: string) {
    this.log('debug', context, message)
  }
}

export const logger = new Logger()

