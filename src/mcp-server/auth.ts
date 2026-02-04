import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerContext } from './index.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || 'default-secret-for-development'
const API_KEY_PREFIX = 'altiteam_'

export interface AuthContext {
  userId: string
  sessionToken?: string
  authMethod: 'jwt' | 'apikey'
}

interface JWTPayload {
  sub: string
  email?: string
  name?: string
}

interface APIKey {
  key: string
  userId: string
  name: string
  createdAt: Date
  expiresAt?: Date
}

const apiKeys = new Map<string, APIKey>()

export function generateAPIKey(
  userId: string,
  name: string,
  expiresAt?: Date,
): string {
  const randomPart =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  const key = `${API_KEY_PREFIX}${randomPart}`

  apiKeys.set(key, {
    key,
    userId,
    name,
    createdAt: new Date(),
    expiresAt,
  })

  return key
}

async function validateJWT(token: string): Promise<JWTPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    if (!decoded.sub) {
      throw new Error('Invalid token: missing user ID')
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired. Please log in again.')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(
        'Invalid token. Please provide a valid authentication token.',
      )
    }
    throw error
  }
}

async function validateAPIKey(apiKey: string): Promise<APIKey> {
  const key = apiKeys.get(apiKey)

  if (!key) {
    throw new Error('Invalid API key. Please provide a valid API key.')
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    apiKeys.delete(apiKey)
    throw new Error('API key expired. Please generate a new API key.')
  }

  return key
}

export function createAuthMiddleware() {
  return async (request: CallToolRequest): Promise<AuthContext> => {
    const authHeader =
      (request as any)._meta?.authorization || (request as any).authorization
    const apiKeyHeader =
      (request as any)._meta?.['x-api-key'] || (request as any)['x-api-key']
    const sessionTokenHeader =
      (request as any)._meta?.['x-session-token'] ||
      (request as any)['x-session-token']

    if (apiKeyHeader) {
      const apiKey = await validateAPIKey(apiKeyHeader)
      return {
        userId: apiKey.userId,
        sessionToken: apiKeyHeader,
        authMethod: 'apikey',
      }
    }

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader
      const payload = await validateJWT(token)
      return {
        userId: payload.sub,
        sessionToken: token,
        authMethod: 'jwt',
      }
    }

    if (sessionTokenHeader) {
      const payload = await validateJWT(sessionTokenHeader)
      return {
        userId: payload.sub,
        sessionToken: sessionTokenHeader,
        authMethod: 'jwt',
      }
    }

    throw new Error(
      'Authentication required. Please provide one of: Bearer token in Authorization header, x-api-key header, or x-session-token header.',
    )
  }
}

export async function validateOrganizationAccess(
  userId: string,
  organizationId: string,
  context: MCPServerContext,
): Promise<boolean> {
  const members =
    await context.repositories.teamMembers.findByOrganizationId(organizationId)
  if (!members.success) {
    return false
  }

  return members.data.some((member: any) => member.userId === userId)
}

export async function validateOrganizationOwnership(
  userId: string,
  organizationId: string,
  context: MCPServerContext,
): Promise<boolean> {
  const org = await context.repositories.organizations.findById(organizationId)
  if (!org.success || !org.data) {
    return false
  }

  return org.data.ownerId === userId
}

export function revokeAPIKey(apiKey: string): boolean {
  return apiKeys.delete(apiKey)
}

export function listAPIKeys(userId: string): APIKey[] {
  const userKeys: APIKey[] = []
  apiKeys.forEach((key) => {
    if (key.userId === userId) {
      userKeys.push(key)
    }
  })
  return userKeys
}
