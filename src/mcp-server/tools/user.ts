import { MCPServerContext, registerTool } from '../index.js'

// User Profile Tools
const getMyProfileTool = {
  name: 'get_my_profile',
  description: 'Get current user\'s profile information',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const result = await context.repositories.users.findById(context.userId)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const user = result.value
    if (!user) {
      return {
        content: [{ type: 'text', text: 'User not found' }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }, null, 2),
        },
      ],
    }
  },
}

const updateMyProfileTool = {
  name: 'update_my_profile',
  description: 'Update current user\'s profile',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'User\'s display name' },
      email: { type: 'string', description: 'User\'s email address' },
      bio: { type: 'string', description: 'User\'s bio/description' },
    },
    required: [],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const updateData: any = {}
    if (args.name !== undefined) updateData.name = args.name
    if (args.email !== undefined) updateData.email = args.email
    // Note: bio is not in the current User type, may need to extend

    const result = await context.repositories.users.update(context.userId, updateData)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Profile updated successfully',
        },
      ],
    }
  },
}

const searchUsersTool = {
  name: 'search_users',
  description: 'Search for users by name or email',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      organizationId: { type: 'string', description: 'Filter by organization' },
      limit: { type: 'number', description: 'Maximum number of results' },
    },
    required: ['query'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    const result = await context.repositories.users.search(
      args.query,
      args.organizationId,
      args.limit
    )

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const users = result.value
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
          })), null, 2),
        },
      ],
    }
  },
}

// Register tools
import { globalContext, registerTool } from '../index.js'

registerTool(getMyProfileTool)
registerTool(updateMyProfileTool)
registerTool(searchUsersTool)