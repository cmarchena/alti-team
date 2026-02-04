import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

// Task CRUD Tools

const createTaskTool = {
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
        enum: ['low', 'medium', 'high', 'urgent'] 
      },
      status: { 
        type: 'string', 
        description: 'Task status',
        enum: ['todo', 'in-progress', 'review', 'done'] 
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
    const projectResult = await context.repositories.projects.findById(args.projectId)
    
    if (projectResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${projectResult.error.message}` }],
        isError: true,
      }
    }

    const project = projectResult.value
    
    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this project' }],
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

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const task = result.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
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
          }, null, 2),
        },
      ],
    }
  },
}

const getTaskTool = {
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

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const task = result.value

    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      }
    }

    // Validate user has access to the task's project
    const projectResult = await context.repositories.projects.findById(task.projectId)
    
    if (projectResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${projectResult.error.message}` }],
        isError: true,
      }
    }

    const project = projectResult.value
    
    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this task' }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
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
          }, null, 2),
        },
      ],
    }
  },
}

const updateTaskTool = {
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
        enum: ['low', 'medium', 'high', 'urgent'] 
      },
      status: { 
        type: 'string', 
        description: 'Task status',
        enum: ['todo', 'in-progress', 'review', 'done'] 
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

    if (existingTask.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${existingTask.error.message}` }],
        isError: true,
      }
    }

    const task = existingTask.value

    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      }
    }

    // Validate user has access to the task's project
    const projectResult = await context.repositories.projects.findById(task.projectId)
    
    if (projectResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${projectResult.error.message}` }],
        isError: true,
      }
    }

    const project = projectResult.value
    
    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this task' }],
        isError: true,
      }
    }

    // Build update data
    const updateData: any = {}
    if (args.title !== undefined) updateData.title = args.title
    if (args.description !== undefined) updateData.description = args.description
    if (args.assigneeId !== undefined) updateData.assignedToId = args.assigneeId
    if (args.dueDate !== undefined) updateData.dueDate = new Date(args.dueDate)
    if (args.priority !== undefined) updateData.priority = args.priority
    if (args.status !== undefined) updateData.status = args.status

    const result = await context.repositories.tasks.update(args.taskId, updateData)

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
          text: 'Task updated successfully',
        },
      ],
    }
  },
}

const deleteTaskTool = {
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

    if (existingTask.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${existingTask.error.message}` }],
        isError: true,
      }
    }

    const task = existingTask.value

    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      }
    }

    // Validate user has access to the task's project
    const projectResult = await context.repositories.projects.findById(task.projectId)
    
    if (projectResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${projectResult.error.message}` }],
        isError: true,
      }
    }

    const project = projectResult.value
    
    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this task' }],
        isError: true,
      }
    }

    const result = await context.repositories.tasks.delete(args.taskId)

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
          text: 'Task deleted successfully',
        },
      ],
    }
  },
}

// List Tasks Tool
const listTasksTool = {
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
        enum: ['todo', 'in-progress', 'review', 'done'] 
      },
      priority: { 
        type: 'string', 
        description: 'Filter by task priority',
        enum: ['low', 'medium', 'high', 'urgent'] 
      },
      dueBefore: { type: 'string', description: 'Filter tasks due before date (ISO format)' },
      dueAfter: { type: 'string', description: 'Filter tasks due after date (ISO format)' },
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
    // Note: Current repository doesn't support filtering, so we fetch all and filter in memory
    const allTasksResult = await context.repositories.tasks.findByProjectId(
      args.projectId || 'all' // This will need to be handled properly
    )

    if (allTasksResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${allTasksResult.error.message}` }],
        isError: true,
      }
    }

    let tasks = allTasksResult.value

    // Apply filters
    if (args.projectId) {
      tasks = tasks.filter(t => t.projectId === args.projectId)
    }

    if (args.assigneeId) {
      tasks = tasks.filter(t => t.assignedToId === args.assigneeId)
    }

    if (args.status) {
      tasks = tasks.filter(t => t.status === args.status)
    }

    if (args.priority) {
      tasks = tasks.filter(t => t.priority === args.priority)
    }

    if (args.dueBefore) {
      const dueBeforeDate = new Date(args.dueBefore)
      tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= dueBeforeDate)
    }

    if (args.dueAfter) {
      const dueAfterDate = new Date(args.dueAfter)
      tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) >= dueAfterDate)
    }

    if (args.limit) {
      tasks = tasks.slice(0, args.limit)
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            projectId: t.projectId,
            assigneeId: t.assignedToId,
            dueDate: t.dueDate,
            createdAt: t.createdAt,
          })), null, 2),
        },
      ],
    }
  },
}

// Search Tasks Tool
const searchTasksTool = {
  name: 'search_tasks',
  description: 'Search tasks by title or description',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      projectId: { type: 'string', description: 'Filter by project ID' },
      limit: { type: 'number', description: 'Maximum number of results' },
    },
    required: ['query'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get all tasks and search
    const allTasksResult = await context.repositories.tasks.findByProjectId(
      args.projectId || 'all'
    )

    if (allTasksResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${allTasksResult.error.message}` }],
        isError: true,
      }
    }

    let tasks = allTasksResult.value

    // Search by query
    const queryLower = args.query.toLowerCase()
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(queryLower) ||
      t.description.toLowerCase().includes(queryLower)
    )

    if (args.projectId) {
      tasks = tasks.filter(t => t.projectId === args.projectId)
    }

    if (args.limit) {
      tasks = tasks.slice(0, args.limit)
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            projectId: t.projectId,
            assigneeId: t.assignedToId,
            dueDate: t.dueDate,
          })), null, 2),
        },
      ],
    }
  },
}

// Get My Tasks Tool
const getMyTasksTool = {
  name: 'get_my_tasks',
  description: 'Get tasks assigned to current user',
  inputSchema: {
    type: 'object',
    properties: {
      status: { 
        type: 'string', 
        description: 'Filter by task status',
        enum: ['todo', 'in-progress', 'review', 'done'] 
      },
      dueToday: { type: 'boolean', description: 'Filter tasks due today' },
      overdue: { type: 'boolean', description: 'Filter overdue tasks' },
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

    // Get tasks assigned to current user
    const tasksResult = await context.repositories.tasks.findByAssignedToId(context.userId)

    if (tasksResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${tasksResult.error.message}` }],
        isError: true,
      }
    }

    let tasks = tasksResult.value

    // Apply filters
    if (args.status) {
      tasks = tasks.filter(t => t.status === args.status)
    }

    if (args.dueToday) {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      
      tasks = tasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) >= todayStart &&
        new Date(t.dueDate) < todayEnd
      )
    }

    if (args.overdue) {
      const now = new Date()
      tasks = tasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < now &&
        t.status !== 'done'
      )
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            projectId: t.projectId,
            dueDate: t.dueDate,
            createdAt: t.createdAt,
          })), null, 2),
        },
      ],
    }
  },
}

// Add Task Comment Tool
const addTaskCommentTool = {
  name: 'add_task_comment',
  description: 'Add a comment to a task',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: { type: 'string', description: 'Task ID' },
      content: { type: 'string', description: 'Comment content' },
    },
    required: ['taskId', 'content'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate user has access to the task
    const taskResult = await context.repositories.tasks.findById(args.taskId)

    if (taskResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${taskResult.error.message}` }],
        isError: true,
      }
    }

    const task = taskResult.value

    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      }
    }

    // Validate user has access to the task's project
    const projectResult = await context.repositories.projects.findById(task.projectId)
    
    if (projectResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${projectResult.error.message}` }],
        isError: true,
      }
    }

    const project = projectResult.value
    
    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this task' }],
        isError: true,
      }
    }

    // Create the comment
    const commentResult = await context.repositories.comments.create({
      content: args.content,
      taskId: args.taskId,
      userId: context.userId,
    })

    if (commentResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${commentResult.error.message}` }],
        isError: true,
      }
    }

    const comment = commentResult.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: comment.id,
            content: comment.content,
            taskId: comment.taskId,
            userId: comment.userId,
            createdAt: comment.createdAt,
            message: 'Comment added successfully',
          }, null, 2),
        },
      ],
    }
  },
}

// Get Task Comments Tool
const getTaskCommentsTool = {
  name: 'get_task_comments',
  description: 'Get all comments for a task',
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

    // Validate user has access to the task
    const taskResult = await context.repositories.tasks.findById(args.taskId)

    if (taskResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${taskResult.error.message}` }],
        isError: true,
      }
    }

    const task = taskResult.value

    if (!task) {
      return {
        content: [{ type: 'text', text: 'Task not found' }],
        isError: true,
      }
    }

    // Validate user has access to the task's project
    const projectResult = await context.repositories.projects.findById(task.projectId)
    
    if (projectResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${projectResult.error.message}` }],
        isError: true,
      }
    }

    const project = projectResult.value
    
    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    const hasAccess = await validateOrganizationAccess(
      context.userId,
      project.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this task' }],
        isError: true,
      }
    }

    // Get comments for the task
    const commentsResult = await context.repositories.comments.findByTaskId(args.taskId)

    if (commentsResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${commentsResult.error.message}` }],
        isError: true,
      }
    }

    const comments = commentsResult.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comments.map(c => ({
            id: c.id,
            content: c.content,
            taskId: c.taskId,
            userId: c.userId,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })), null, 2),
        },
      ],
    }
  },
}

// Register task tools
registerTool(createTaskTool)
registerTool(getTaskTool)
registerTool(updateTaskTool)
registerTool(deleteTaskTool)
registerTool(listTasksTool)
registerTool(searchTasksTool)
registerTool(getMyTasksTool)
registerTool(addTaskCommentTool)
registerTool(getTaskCommentsTool)