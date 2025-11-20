import { tenantContext } from '@/lib/tenant-context'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: { name: string; message: string; stack?: string }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private withTenantContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    try {
      const ctx = tenantContext.getContextOrNull?.()
      if (!ctx) return context
      return {
        tenantId: ctx.tenantId,
        tenantSlug: ctx.tenantSlug ?? undefined,
        userId: ctx.userId ?? undefined,
        requestId: ctx.requestId ?? undefined,
        role: ctx.role ?? undefined,
        tenantRole: ctx.tenantRole ?? undefined,
        ...(context || {}),
      }
    } catch {
      return context
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack || undefined,
          }
        : undefined,
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const enriched = this.withTenantContext(context)
    const logEntry = this.formatMessage(level, message, enriched, error)

    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(`🐛 ${message}`, enriched || '', error || '')
          break
        case 'info':
          console.info(`ℹ️ ${message}`, enriched || '')
          break
        case 'warn':
          console.warn(`⚠️ ${message}`, enriched || '', error || '')
          break
        case 'error':
          console.error(`❌ ${message}`, enriched || '', error || '')
          break
      }
    } else {
      console.log(JSON.stringify(logEntry))
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('warn', message, context, error)
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('error', message, context, error)
  }

  apiRequest(method: string, path: string, userId?: string, duration?: number) {
    this.info('API Request', { method, path, userId, duration: duration ? `${duration}ms` : undefined })
  }

  apiError(method: string, path: string, error: Error, userId?: string) {
    this.error('API Error', { method, path, userId, errorName: error.name, errorMessage: error.message }, error)
  }

  authAttempt(email: string, success: boolean, ip?: string) {
    this.info('Authentication Attempt', { email, success, ip })
  }

  authFailure(email: string, reason: string, ip?: string) {
    this.warn('Authentication Failure', { email, reason, ip })
  }

  databaseQuery(query: string, duration?: number, error?: Error) {
    if (error) {
      this.error(
        'Database Query Failed',
        { query: query.substring(0, 100) + (query.length > 100 ? '...' : ''), duration: duration ? `${duration}ms` : undefined },
        error,
      )
    } else {
      this.debug('Database Query', { query: query.substring(0, 100) + (query.length > 100 ? '...' : ''), duration: duration ? `${duration}ms` : undefined })
    }
  }

  emailSent(to: string, subject: string, success: boolean, error?: Error) {
    if (success) {
      this.info('Email Sent', { to, subject })
    } else {
      this.error('Email Failed', { to, subject }, error)
    }
  }

  cronJob(jobName: string, success: boolean, duration?: number, error?: Error) {
    if (success) {
      this.info('Cron Job Completed', { jobName, duration: duration ? `${duration}ms` : undefined })
    } else {
      this.error('Cron Job Failed', { jobName, duration: duration ? `${duration}ms` : undefined }, error)
    }
  }

  securityEvent(event: string, details: Record<string, unknown>, severity: 'low' | 'medium' | 'high' = 'medium') {
    this.warn('Security Event', { event, severity, ...details })
  }

  performanceMetric(metric: string, value: number, unit: string = 'ms') {
    this.info('Performance Metric', { metric, value, unit })
  }

  audit(payload: { action: string; actorId?: string; targetId?: string; details?: Record<string, unknown> }) {
    this.info('Audit Event', payload)
  }
}

export const logger = new Logger()

export function withTiming<T>(
  operation: () => Promise<T>,
  logMessage: string,
  context?: Record<string, unknown>,
): Promise<T> {
  const start = Date.now()

  return operation()
    .then((result) => {
      const duration = Date.now() - start
      logger.info(`${logMessage} completed`, { ...context, duration: `${duration}ms` })
      return result
    })
    .catch((error) => {
      const duration = Date.now() - start
      logger.error(`${logMessage} failed`, { ...context, duration: `${duration}ms` }, error as Error)
      throw error
    })
}

export function logApiRoute(
  handler: (req: { method: string; url: string; user?: { id?: string } }, res: unknown) => Promise<unknown>,
) {
  return async (req: { method: string; url: string; user?: { id?: string } }, res: unknown) => {
    const start = Date.now()
    const { method, url } = req

    try {
      const result = await handler(req, res)
      const duration = Date.now() - start
      logger.apiRequest(method, url, req.user?.id, duration)
      return result
    } catch (error) {
      logger.apiError(method, url, error as Error, req.user?.id)
      throw error
    }
  }
}
