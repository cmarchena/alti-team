import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

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

    if (notificationsResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${notificationsResult.error.message}` }],
        isError: true,
      }
    }

    let notifications = notificationsResult.value

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
          text: JSON.stringify(notifications.map(n => ({
            id: n.id,
            type: n.type,
            message: n.message,
            read: n.read,
            createdAt: n.createdAt,
          })), null, 2),
        },
      ],
    }
  },
}

// Mark Notification Read Tool
const markNotificationReadTool = {
  name: 'mark_notification_read',
  description: 'Mark notification as read',
  inputSchema: {
    type: 'object',
    properties: {
      notificationId: { type: 'string', description: 'Notification ID' },
    },
    required: ['notificationId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get the notification first to verify it belongs to the user
    const notificationResult = await context.repositories.notifications.findById(args.notificationId)

    if (notificationResult.isErr() || !notificationResult.value) {
      return {
        content: [{ type: 'text', text: 'Notification not found' }],
        isError: true,
      }
    }

    const notification = notificationResult.value

    // Verify the notification belongs to the current user
    if (notification.userId !== context.userId) {
      return {
        content: [{ type: 'text', text: 'Access denied. This notification does not belong to you.' }],
        isError: true,
      }
    }

    const result = await context.repositories.notifications.markAsRead(args.notificationId)

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
          text: 'Notification marked as read',
        },
      ],
    }
  },
}

// Mark All Notifications Read Tool
const markAllNotificationsReadTool = {
  name: 'mark_all_notifications_read',
  description: 'Mark all notifications as read',
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

    const result = await context.repositories.notifications.markAllAsRead(context.userId)

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
          text: 'All notifications marked as read',
        },
      ],
    }
  },
}

// Register tools
registerTool(getMyNotificationsTool)
registerTool(markNotificationReadTool)
registerTool(markAllNotificationsReadTool)