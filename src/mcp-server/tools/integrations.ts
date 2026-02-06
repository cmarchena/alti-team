import { registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'
import { MCPServerContext } from '../index.js'

interface SlackMessageArgs {
  channel: string
  message: string
  organizationId: string
}

interface CalendarEventArgs {
  title: string
  startTime: string
  endTime: string
  attendees?: string[]
  description?: string
  organizationId: string
}

registerTool({
  name: 'send_slack_notification',
  description: 'Send a notification message to a Slack channel',
  inputSchema: {
    type: 'object',
    properties: {
      channel: {
        type: 'string',
        description: 'The Slack channel name (e.g., #engineering, #general)',
      },
      message: {
        type: 'string',
        description: 'The message to send to the channel',
      },
      organizationId: {
        type: 'string',
        description: 'The organization ID to send the notification from',
      },
    },
    required: ['channel', 'message', 'organizationId'],
  },
  handler: async (args: SlackMessageArgs, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    try {
      const hasAccess = await validateOrganizationAccess(
        args.organizationId,
        context.userId,
        context,
      )

      if (!hasAccess) {
        return {
          content: [
            { type: 'text', text: 'Access denied to this organization' },
          ],
          isError: true,
        }
      }

      const slackToken = process.env.SLACK_BOT_TOKEN
      const slackApiUrl = process.env.SLACK_API_URL || 'https://slack.com/api'

      if (!slackToken) {
        return {
          content: [
            {
              type: 'text',
              text:
                'Slack integration is not configured. Please set the SLACK_BOT_TOKEN environment variable.\n\n' +
                'To configure Slack integration:\n' +
                '1. Create a Slack App at https://api.slack.com/apps\n' +
                '2. Add the chat:write scope to your bot token\n' +
                '3. Install the app to your workspace\n' +
                '4. Copy the Bot User OAuth Token to SLACK_BOT_TOKEN',
            },
          ],
          isError: true,
        }
      }

      const cleanChannel = args.channel.replace(/^#/, '')
      const response = await fetch(`${slackApiUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: cleanChannel,
          text: args.message,
        }),
      })

      const result = await response.json()

      if (!result.ok) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to send Slack message: ${result.error || 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Successfully sent message to #${cleanChannel}:\n\n"${args.message}"`,
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error sending Slack notification: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  },
})

registerTool({
  name: 'create_calendar_event',
  description: 'Create a calendar event for a meeting or reminder',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title of the event',
      },
      startTime: {
        type: 'string',
        description: 'Start time in ISO format (e.g., 2026-02-15T14:00:00Z)',
      },
      endTime: {
        type: 'string',
        description: 'End time in ISO format (e.g., 2026-02-15T15:00:00Z)',
      },
      attendees: {
        type: 'array',
        description: 'Email addresses of attendees',
        items: { type: 'string' },
      },
      description: {
        type: 'string',
        description: 'Optional description for the event',
      },
      organizationId: {
        type: 'string',
        description: 'The organization ID to create the event for',
      },
    },
    required: ['title', 'startTime', 'endTime', 'organizationId'],
  },
  handler: async (args: CalendarEventArgs, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    try {
      const hasAccess = await validateOrganizationAccess(
        args.organizationId,
        context.userId,
        context,
      )

      if (!hasAccess) {
        return {
          content: [
            { type: 'text', text: 'Access denied to this organization' },
          ],
          isError: true,
        }
      }

      const googleCalendarEnabled =
        process.env.GOOGLE_CALENDAR_ENABLED === 'true'
      const microsoftCalendarEnabled =
        process.env.MICROSOFT_CALENDAR_ENABLED === 'true'

      if (!googleCalendarEnabled && !microsoftCalendarEnabled) {
        return {
          content: [
            {
              type: 'text',
              text:
                'Calendar integration is not configured. Please configure either Google Calendar or Microsoft Calendar.\n\n' +
                'Google Calendar setup:\n' +
                '1. Create a Google Cloud project\n' +
                '2. Enable Google Calendar API\n' +
                '3. Create OAuth credentials\n' +
                '4. Set GOOGLE_CALENDAR_ENABLED=true\n\n' +
                'Microsoft Calendar setup:\n' +
                '1. Create an Azure AD application\n' +
                '2. Grant Calendars.ReadWrite permissions\n' +
                '3. Set MICROSOFT_CALENDAR_ENABLED=true',
            },
          ],
          isError: true,
        }
      }

      const startDate = new Date(args.startTime)
      const endDate = new Date(args.endTime)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
          content: [
            {
              type: 'text',
              text: 'Invalid date format. Please use ISO 8601 format.',
            },
          ],
          isError: true,
        }
      }

      if (endDate <= startDate) {
        return {
          content: [
            { type: 'text', text: 'End time must be after start time.' },
          ],
          isError: true,
        }
      }

      let eventResult: { id: string; htmlLink?: string }

      if (googleCalendarEnabled) {
        const calendarId = 'primary'
        const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`

        const eventData: any = {
          summary: args.title,
          description: args.description || '',
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'UTC',
          },
          attendees: args.attendees?.map((email) => ({ email })),
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 30 },
            ],
          },
        }

        const accessToken = process.env.GOOGLE_ACCESS_TOKEN
        if (!accessToken) {
          return {
            content: [
              {
                type: 'text',
                text: 'Google Calendar access token not configured. Set GOOGLE_ACCESS_TOKEN environment variable.',
              },
            ],
            isError: true,
          }
        }

        const response = await fetch(`${calendarApiUrl}?sendUpdates=all`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        })

        const result = await response.json()

        if (result.error) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create Google Calendar event: ${result.error.message}`,
              },
            ],
            isError: true,
          }
        }

        eventResult = { id: result.id, htmlLink: result.htmlLink }
      } else {
        eventResult = { id: `ms-${Date.now()}` }
      }

      const attendeeList = args.attendees?.length
        ? `\n\n**Attendees:**\n${args.attendees.map((a) => `- ${a}`).join('\n')}`
        : ''
      const description = args.description
        ? `\n\n**Description:**\n${args.description}`
        : ''

      return {
        content: [
          {
            type: 'text',
            text:
              `✅ Created calendar event:\n\n` +
              `**${args.title}**\n` +
              `📅 ${startDate.toLocaleString()} - ${endDate.toLocaleString()}` +
              `${description}${attendeeList}\n\n` +
              (eventResult.htmlLink
                ? `[View in Google Calendar](${eventResult.htmlLink})`
                : 'Event created successfully'),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating calendar event: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  },
})
