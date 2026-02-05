import { isSuccess, isFailure } from '../../lib/result'
import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

const batchUpdateTasksTool = {
  name: 'batch_update_tasks',
  description: 'Update multiple tasks at once',
  inputSchema: {
    type: 'object',
    properties: {
      taskIds: {
        type: 'array',
        description: 'Array of task IDs to update',
        items: { type: 'string' },
      },
      updates: {
        type: 'object',
        description: 'Fields to update',
        properties: {
          status: {
            type: 'string',
            description: 'New status',
            enum: ['todo', 'in-progress', 'review', 'done'],
          },
          priority: {
            type: 'string',
            description: 'New priority',
            enum: ['low', 'medium', 'high', 'urgent'],
          },
          assigneeId: { type: 'string', description: 'New assignee ID' },
        },
      },
    },
    required: ['taskIds', 'updates'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const { taskIds, updates } = args

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return {
        content: [{ type: 'text', text: 'taskIds must be a non-empty array' }],
        isError: true,
      }
    }

    const results: { taskId: string; success: boolean; error?: string }[] = []
    let accessErrors: string[] = []

    for (const taskId of taskIds) {
      try {
        const taskResult = await context.repositories.tasks.findById(taskId)

        if (isFailure(taskResult) || !taskResult.data) {
          results.push({ taskId, success: false, error: 'Task not found' })
          continue
        }

        const task = taskResult.data

        const hasAccess = await validateOrganizationAccess(
          context.userId,
          task.projectId,
          context,
        )

        if (!hasAccess) {
          accessErrors.push(taskId)
          continue
        }

        const updateData: any = {}
        if (updates.status !== undefined) updateData.status = updates.status
        if (updates.priority !== undefined)
          updateData.priority = updates.priority
        if (updates.assigneeId !== undefined)
          updateData.assigneeId = updates.assigneeId

        const updateResult = await context.repositories.tasks.update(
          taskId,
          updateData,
        )

        if (isFailure(updateResult)) {
          results.push({
            taskId,
            success: false,
            error: updateResult.error.message,
          })
        } else {
          results.push({ taskId, success: true })
        }
      } catch (error) {
        results.push({
          taskId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    let message = `Updated ${successful} of ${taskIds.length} tasks`

    if (failed > 0) {
      const failedIds = results.filter((r) => !r.success).map((r) => r.taskId)
      message += `\nFailed tasks: ${failedIds.join(', ')}`
    }

    if (accessErrors.length > 0) {
      message += `\nAccess denied for ${accessErrors.length} tasks`
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message,
              total: taskIds.length,
              successful,
              failed,
              results,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
}

const batchAssignTasksTool = {
  name: 'batch_assign_tasks',
  description: 'Assign multiple tasks to a user',
  inputSchema: {
    type: 'object',
    properties: {
      taskIds: {
        type: 'array',
        description: 'Array of task IDs to assign',
        items: { type: 'string' },
      },
      assigneeId: { type: 'string', description: 'User ID to assign tasks to' },
    },
    required: ['taskIds', 'assigneeId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const { taskIds, assigneeId } = args

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return {
        content: [{ type: 'text', text: 'taskIds must be a non-empty array' }],
        isError: true,
      }
    }

    const userResult = await context.repositories.users.findById(assigneeId)
    if (isFailure(userResult) || !userResult.data) {
      return {
        content: [{ type: 'text', text: 'Assignee user not found' }],
        isError: true,
      }
    }

    const assignee = userResult.data
    const results: { taskId: string; success: boolean; error?: string }[] = []

    for (const taskId of taskIds) {
      try {
        const taskResult = await context.repositories.tasks.findById(taskId)

        if (isFailure(taskResult) || !taskResult.data) {
          results.push({ taskId, success: false, error: 'Task not found' })
          continue
        }

        const task = taskResult.data

        const hasAccess = await validateOrganizationAccess(
          context.userId,
          task.projectId,
          context,
        )

        if (!hasAccess) {
          results.push({ taskId, success: false, error: 'Access denied' })
          continue
        }

        const updateResult = await context.repositories.tasks.update(taskId, {
          assignedToId: assigneeId,
        })

        if (isFailure(updateResult)) {
          results.push({
            taskId,
            success: false,
            error: updateResult.error.message,
          })
        } else {
          results.push({ taskId, success: true })
        }
      } catch (error) {
        results.push({
          taskId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: `Assigned ${successful} of ${taskIds.length} tasks to ${assignee.name || assignee.email}`,
              assignee: {
                id: assignee.id,
                name: assignee.name,
                email: assignee.email,
              },
              total: taskIds.length,
              successful,
              failed,
              results,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
}

registerTool(batchUpdateTasksTool)
registerTool(batchAssignTasksTool)
