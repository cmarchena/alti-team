import { getRepositories } from '../lib/repositories/index.js'
import { logger } from './logger.js'

export interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: boolean
    repositories: boolean
  }
}

let serverStartTime = Date.now()

export function getUptime(): number {
  return Math.floor((Date.now() - serverStartTime) / 1000)
}

export function updateServerStartTime(): void {
  serverStartTime = Date.now()
}

interface HealthCheckResult {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}

export async function performHealthCheck(): Promise<HealthCheck> {
  const checks: HealthCheck['checks'] = {
    database: false,
    repositories: false,
  }

  try {
    const repos = getRepositories()
    checks.repositories = true

    try {
      const result = await repos.users.findById('health-check')
      if (result && typeof result === 'object' && 'id' in result) {
        checks.database = true
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not_found')) {
        checks.database = true
      } else {
        logger.warn('Database health check failed', { error: String(error) })
      }
    }
  } catch (error) {
    logger.error('Repository health check failed', { error: String(error) })
  }

  const allHealthy = Object.values(checks).every(Boolean)

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: getUptime(),
    checks,
  }
}

export function createHealthCheckHandler() {
  return async (): Promise<HealthCheckResult> => {
    const health = await performHealthCheck()
    const isHealthy = health.status === 'healthy'

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(health, null, 2),
        },
      ],
      isError: !isHealthy,
    }
  }
}
