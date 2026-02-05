const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return (
    levels[level] >= levels[LOG_LEVEL as LogLevel] ||
    levels[level] >= levels.info
  )
}

function formatMessage(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}]${metaStr} ${message}`
}

export const logger = {
  debug: (message: string, meta?: any) => {
    if (shouldLog('debug')) {
      console.error(formatMessage('debug', message, meta))
    }
  },
  info: (message: string, meta?: any) => {
    if (shouldLog('info')) {
      console.error(formatMessage('info', message, meta))
    }
  },
  warn: (message: string, meta?: any) => {
    if (shouldLog('warn')) {
      console.error(formatMessage('warn', message, meta))
    }
  },
  error: (message: string, meta?: any) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta))
    }
  },
}
