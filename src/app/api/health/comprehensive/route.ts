import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    prisma: { status: string; message: string; responseTime: number }
    database: { status: string; message: string; responseTime: number }
    environment: { status: string; message: string }
  }
  details: Record<string, any>
}

export async function GET(): Promise<Response> {
  const startTime = Date.now()
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      prisma: { status: 'checking', message: '', responseTime: 0 },
      database: { status: 'checking', message: '', responseTime: 0 },
      environment: { status: 'checking', message: '' },
    },
    details: {
      nodeEnv: process.env.NODE_ENV,
      prismaMock: process.env.PRISMA_MOCK,
      databaseUrlConfigured: !!process.env.DATABASE_URL || !!process.env.NETLIFY_DATABASE_URL,
    },
  }

  // Check Prisma initialization
  let prismaStart = Date.now()
  try {
    const prisma = await getPrisma()
    const prismaDuration = Date.now() - prismaStart

    if (!prisma) {
      health.checks.prisma = {
        status: 'unhealthy',
        message: 'Prisma client returned null',
        responseTime: prismaDuration,
      }
      health.status = 'unhealthy'
    } else {
      health.checks.prisma = {
        status: 'healthy',
        message: 'Prisma client initialized successfully',
        responseTime: prismaDuration,
      }
    }
  } catch (error) {
    const prismaDuration = Date.now() - prismaStart
    health.checks.prisma = {
      status: 'unhealthy',
      message: `Failed to initialize Prisma: ${error instanceof Error ? error.message : String(error)}`,
      responseTime: prismaDuration,
    }
    health.status = 'unhealthy'
    health.details.prismaError = error instanceof Error ? error.stack : String(error)
  }

  // Check database connectivity
  let dbStart = Date.now()
  try {
    const prisma = await getPrisma()
    
    // Test database connection with a simple query
    await (prisma as any).$queryRaw`SELECT 1`
    
    const dbDuration = Date.now() - dbStart
    health.checks.database = {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: dbDuration,
    }
  } catch (error) {
    const dbDuration = Date.now() - dbStart
    health.checks.database = {
      status: 'unhealthy',
      message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
      responseTime: dbDuration,
    }
    health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy'
    health.details.databaseError = error instanceof Error ? error.message : String(error)
    
    // More detailed error info for debugging
    if (error instanceof Error) {
      health.details.databaseErrorType = error.name
      if (error.message.includes('ECONNREFUSED')) {
        health.details.databaseErrorReason = 'Connection refused - database may be down or unreachable'
      } else if (error.message.includes('P1000')) {
        health.details.databaseErrorReason = 'Authentication failed - check DATABASE_URL credentials'
      } else if (error.message.includes('P1001')) {
        health.details.databaseErrorReason = 'Cannot reach database server'
      } else if (error.message.includes('P1002')) {
        health.details.databaseErrorReason = 'Database connection timeout'
      } else if (error.message.includes('P5009')) {
        health.details.databaseErrorReason = 'Client library request error'
      }
    }
  }

  // Check environment
  try {
    const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
    const hasRequiredEnv = {
      databaseUrl: !!databaseUrl,
      nodeEnv: !!process.env.NODE_ENV,
    }

    if (!hasRequiredEnv.databaseUrl) {
      health.checks.environment = {
        status: 'unhealthy',
        message: 'DATABASE_URL or NETLIFY_DATABASE_URL not configured',
      }
      health.status = 'unhealthy'
    } else if (hasRequiredEnv.databaseUrl) {
      health.checks.environment = {
        status: 'healthy',
        message: 'All required environment variables configured',
      }
    }

    health.details.environmentVars = hasRequiredEnv
  } catch (error) {
    health.checks.environment = {
      status: 'degraded',
      message: `Failed to check environment: ${error instanceof Error ? error.message : String(error)}`,
    }
    health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy'
  }

  const totalDuration = Date.now() - startTime
  health.details.totalResponseTime = `${totalDuration}ms`

  // Determine final status
  const unhealthyChecks = Object.values(health.checks).filter(c => c.status === 'unhealthy').length
  if (unhealthyChecks > 0) {
    health.status = 'unhealthy'
  } else if (
    Object.values(health.checks).some(c => c.status === 'degraded')
  ) {
    health.status = 'degraded'
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503

  return NextResponse.json(health, { status: statusCode })
}
