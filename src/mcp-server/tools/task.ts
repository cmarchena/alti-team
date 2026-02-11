import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'
import { isFailure, isSuccess } from '../../lib/result.js'

// Task CRUD Tools

registerTool({
  name: 'create_task',
  description: 'Create a new task',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string', description: 'Task description' },
      assigneeId: { type: 'string', description: 'User ID to assign task to' },
      dueDate: { type: 'string', description: 'Task due date (ISO format)' },
      priority: {
        type: 'string',
        description: 'Task priority',
        enum: ['low', 'medium', 'high', 'urgent'],
      },
      status: {
        type: 'string',
        description: 'Task status',
        enum: ['todo', 'in-progress', 'review', 'done'],
      },
    },
    required: ['projectId', 'title'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate user has access to the project's organization
    const projectResult = await context.repositories.projects.findById(
      args.projectId,
    )

    if (isFailure(projectResult)) {
      return {
        content: [
          { type: 'text', text: `Error: ${projectResult.error?.message || 'Unknown error'}` },
        ],
        isError: true,
      }
    }

    const project = projectResult.data

    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context,
    )

    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied: User does not have access to this project',
          },
        ],
        isError: true,
      }
    }

    // Convert due date if provided
    const createData: any = {
      title: args.title,
      description: args.description || '',
      projectId: args.projectId,
      status: args.status || 'todo',
      priority: args.priority || 'medium',
    }

    if (args.assigneeId) createData.assignedToId = args.assigneeId
    if (args.dueDate) createData.dueDate = new Date(args.dueDate)

    const result = await context.repositories.tasks.create(createData)

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error?.message || 'Unknown error'}` }],
        isError: true,
      }
    }

    const task = result.data

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: task?.id,
              title: task?.title,
              description: task?.description,
              status: task?.status,
              priority: task?.priority,
              projectId: task?.projectId,
              assigneeId: task?.assignedToId,
              dueDate: task?.dueDate,
              createdAt: task?.createdAt,
              updatedAt: task?.updatedAt,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
})

registerTool({
  name: 'get_task',
  description: 'Get task details',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: { type: 'string', description: 'Task ID' },
    },
    required: ['taskId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const result = await context.repositories.tasks.findById(args.taskId)

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error?.message || 'Unknown error'}` }],
        isError: true,
      }
    }

    const task = result.data

    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      }
    }

    // Validate user has access to the task's project
    const projectResult = await context.repositories.projects.findById(
      task.projectId,
    )

    if (isFailure(projectResult)) {
      return {
        content: [
          { type: 'text', text: `Error: ${projectResult.error?.message || 'Unknown error'}` },
        ],
        isError: true,
      }
    }

    const project = projectResult.data

    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context,
    )

    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied: User does not have access to this task',
          },
        ],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              projectId: task.projectId,
              assigneeId: task.assignedToId,
              dueDate: task.dueDate,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
})

registerTool({
  name: 'update_task',
  description: 'Update task information',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: { type: 'string', description: 'Task ID' },
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string', description: 'Task description' },
      assigneeId: { type: 'string', description: 'User ID to assign task to' },
      dueDate: { type: 'string', description: 'Task due date (ISO format)' },
      priority: {
        type: 'string',
        description: 'Task priority',
        enum: ['low', 'medium', 'high', 'urgent'],
      },
      status: {
        type: 'string',
        description: 'Task status',
        enum: ['todo', 'in-progress', 'review', 'done'],
      },
    },
    required: ['taskId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get existing task to validate access
    const existingTask = await context.repositories.tasks.findById(args.taskId)

    if (isFailure(existingTask)) {
      return {
        content: [
          { type: 'text', text: `Error: ${existingTask.error?.message || 'Unknown error'}` },
        ],
        isError: true,
      }
    }

    const task = existingTask.data

    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      }
    }

    // Validate user has access to the task's project
    const projectResult = await context.repositories.projects.findById(
      task.projectId,
    )

    if (isFailure(projectResult)) {
      return {
        content: [
          { type: 'text', text: `Error: ${projectResult.error?.message || 'Unknown error'}` },
        ],
        isError: true,
      }
    }

    const project = projectResult.data

    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context,
    )

    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied: User does not have access to this task',
          },
        ],
        isError: true,
      }
    }

    // Build update data
    const updateData: any = {}
    if (args.title !== undefined) updateData.title = args.title
    if (args.description !== undefined)
      updateData.description = args.description
    if (args.assigneeId !== undefined) updateData.assignedToId = args.assigneeId
    if (args.dueDate !== undefined) updateData.dueDate = new Date(args.dueDate)
    if (args.priority !== undefined) updateData.priority = args.priority
    if (args.status !== undefined) updateData.status = args.status

    const result = await context.repositories.tasks.update(
      args.taskId,
      updateData,
    )

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error?.message || 'Unknown error'}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Task updated successfully',
        },
      ],
    }
  },
})

registerTool({
  name: 'delete_task',
  description: 'Delete a task',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: { type: 'string', description: 'Task ID' },
    },
    required: ['taskId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get existing task to validate access
    const existingTask = await context.repositories.tasks.findById(args.taskId)

    if (isFailure(existingTask)) {
      return {
        content: [
          { type: 'text', text: `Error: ${existingTask.error?.message || 'Unknown error'}` },
        ],
        isError: true,
      }
    }

    const task = existingTask.data

    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      }
    }

    // Validate user has access to the task's project
    const projectResult = await context.repositories.projects.findById(
      task.projectId,
    )

    if (isFailure(projectResult)) {
      return {
        content: [
          { type: 'text', text: `Error: ${projectResult.error?.message || 'Unknown error'}` },
        ],
        isError: true,
      }
    }

    const project = projectResult.data

    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context,
    )

    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied: User does not have access to this task',
          },
        ],
        isError: true,
      }
    }

    const result = await context.repositories.tasks.delete(args.taskId)

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error?.message || 'Unknown error'}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Task deleted successfully',
        },
      ],
    }
  },
})

// List Tasks Tool
registerTool({
  name: 'list_tasks',
  description: 'List tasks with filters',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Filter by project ID' },
      assigneeId: { type: 'string', description: 'Filter by assignee ID' },
      status: {
        type: 'string',
        description: 'Filter by task status',
        enum: ['todo', 'in-progress', 'review', 'done'],
      },
      priority: {
        type: 'string',
        description: 'Filter by task priority',
        enum: ['low', 'medium', 'high', 'urgent'],
      },
      dueBefore: {
        type: 'string',
        description: 'Filter tasks due before date (ISO format)',
      },
      dueAfter: {
        type: 'string',
        description: 'Filter tasks due after date (ISO format)',
      },
      limit: { type: 'number', description: 'Maximum number of results' },
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

    // Get all tasks and filter
    // Note: When no projectId is provided, we fetch all tasks
    const allTasksResult = await context.repositories.tasks.findByProjectId(
      args.projectId || '',
    )

    if (isFailure(allTasksResult)) {
      return {
        content: [
          { type: 'text', text: `Error fetching tasks: ${allTasksResult.error?.message || 'Unknown error'}` },
        ],
        isError: true,
      }
    }

    let tasks = allTasksResult.data || []

    // Apply filters
    if (args.assigneeId) {
      tasks = tasks.filter((t) => t.assignedToId === args.assigneeId)
    }

    if (args.status) {
      tasks = tasks.filter((t) => t.status === args.status)
    }

    if (args.priority) {
      tasks = tasks.filter((t) => t.priority === args.priority)
    }

    if (args.dueBefore) {
      const dueBefore = new Date(args.dueBefore)
      tasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) <= dueBefore)
    }

    if (args.dueAfter) {
      const dueAfter = new Date(args.dueAfter)
      tasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) >= dueAfter)
    }

    // Apply limit
    const limit = args.limit || 50
    tasks = tasks.slice(0, limit)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tasks: tasks.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                projectId: t.projectId,
                assigneeId: t.assignedToId,
                dueDate: t.dueDate,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
              })),
              total: tasks.length,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
})
