import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerContext } from './index.js'

// Authentication context
export interface AuthContext {
  userId: string
  sessionToken?: string
}

// Auth middleware function
export function createAuthMiddleware() {
  return async (request: CallToolRequest): Promise<AuthContext> => {
    // Extract authentication token from request
    // For now, support API key in headers or session token
    const authHeader = (request as any)._headers?.authorization
    const apiKey = (request as any)._headers?.['x-api-key']
    const sessionToken = (request as any)._headers?.['x-session-token']

    // TODO: Implement proper token validation
    // For now, accept any non-empty token and use a placeholder user ID
    if (!authHeader && !apiKey && !sessionToken) {
      throw new Error('Authentication required. Please provide API key or session token.')
    }

    // Placeholder: In real implementation, validate token and extract user ID
    // For now, return a placeholder user ID
    return {
      userId: 'user-123', // This would be extracted from validated token
      sessionToken: sessionToken || apiKey,
    }
  }
}

// Helper to validate user has access to organization
export async function validateOrganizationAccess(
  userId: string,
  organizationId: string,
  context: MCPServerContext
): Promise<boolean> {
  // Check if user is a member of the organization
  const members = await context.repositories.teamMembers.findByOrganizationId(organizationId)
  if (members.isErr()) {
    return false
  }

  return members.value.some(member => member.userId === userId)
}

// Helper to validate user owns organization
export async function validateOrganizationOwnership(
  userId: string,
  organizationId: string,
  context: MCPServerContext
): Promise<boolean> {
  const org = await context.repositories.organizations.findById(organizationId)
  if (org.isErr() || !org.value) {
    return false
  }

  return org.value.ownerId === userId
}