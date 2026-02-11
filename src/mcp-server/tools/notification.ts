import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'
import { isFailure } from '../../lib/result.js'

// Get My Notifications Tool
const getMyNotificationsTool = {
  name: 'get_my_notifications',
  description: 'Get user\'s notifications',
  inputSchema: {
    type: 'object',
    properties: {
      unreadOnly: { type: 'boolean', description: 'Show only unread notifications' },
      limit: { type: 'number', description: 'Maximum number of notifications to return' },
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

    const notificationsResult = await context.repositories.notifications.findByUserId(context.userId)

    if (isFailure(notificationsResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${notificationsResult.error.message}` }],
        isError: true,
      }
    }

    let notifications = notificationsResult.data

    // Filter unread if requested
    if (args.unreadOnly) {
      notifications = notifications.filter(n => !n.read)
    }

    // Apply limit
    if (args.limit) {
      notifications = notifications.slice(0, args.limit)
    }

    // Sort by createdAt (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(notifications, null, 2),
        },
      ],
    }
  },
}

// Register tools
registerTool(getMyNotificationsTool)
