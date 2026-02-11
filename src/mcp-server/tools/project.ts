import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'
import { isFailure, isSuccess } from '../../lib/result.js'

// Project CRUD Tools

const createProjectTool = {
  name: 'create_project',
  description: 'Create a new project',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
      name: { type: 'string', description: 'Project name' },
      description: { type: 'string', description: 'Project description' },
      startDate: {
        type: 'string',
        description: 'Project start date (ISO format)',
      },
      endDate: { type: 'string', description: 'Project end date (ISO format)' },
      status: {
        type: 'string',
        description: 'Project status',
        enum: ['planning', 'active', 'on-hold', 'completed'],
      },
    },
    required: ['organizationId', 'name'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate user has access to organization
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      args.organizationId,
      context,
    )

    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied: User does not have access to this organization',
          },
        ],
        isError: true,
      }
    }

    // Convert dates if provided
    const createData: any = {
      name: args.name,
      description: args.description || '',
      organizationId: args.organizationId,
      status: args.status || 'planning',
    }

    if (args.startDate) createData.startDate = new Date(args.startDate)
    if (args.endDate) createData.endDate = new Date(args.endDate)

    const result = await context.repositories.projects.create(createData)

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const project = result.data

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: project.id,
              name: project.name,
              description: project.description,
              status: project.status,
              organizationId: project.organizationId,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
}

const getProjectTool = {
  name: 'get_project',
  description: 'Get project details',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
    },
    required: ['projectId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const result = await context.repositories.projects.findById(args.projectId)

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const project = result.data
    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
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
            text: 'Access denied: You do not have access to this organization',
          },
        ],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(project, null, 2),
        },
      ],
    }
  },
}

const updateProjectTool = {
  name: 'update_project',
  description: 'Update a project',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      name: { type: 'string', description: 'Project name' },
      description: { type: 'string', description: 'Project description' },
      status: {
        type: 'string',
        description: 'Project status',
        enum: ['planning', 'active', 'on-hold', 'completed'],
      },
      endDate: { type: 'string', description: 'Project end date (ISO format)' },
    },
    required: ['projectId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get the existing project first to verify access
    const existingProjectResult = await context.repositories.projects.findById(args.projectId)

    if (isFailure(existingProjectResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${existingProjectResult.error.message}` }],
        isError: true,
      }
    }

    const existingProject = existingProjectResult.data
    if (!existingProject) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      existingProject.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied: You do not have access to this organization',
          },
        ],
        isError: true,
      }
    }

    const updateData: any = {}
    if (args.name !== undefined) updateData.name = args.name
    if (args.description !== undefined) updateData.description = args.description
    if (args.status !== undefined) updateData.status = args.status
    if (args.endDate) updateData.endDate = new Date(args.endDate)

    const result = await context.repositories.projects.update(args.projectId, updateData)

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Project updated successfully',
        },
      ],
    }
  },
}

const listProjectsTool = {
  name: 'list_projects',
  description: 'List projects in an organization',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
      status: {
        type: 'string',
        description: 'Filter by status',
        enum: ['planning', 'active', 'on-hold', 'completed'],
      },
    },
    required: ['organizationId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      args.organizationId,
      context,
    )
    if (!hasAccess) {
      return {
        content: [
          {
            type: 'text',
            text: 'Access denied: You do not have access to this organization',
          },
        ],
        isError: true,
      }
    }

    const allProjectsResult = await context.repositories.projects.findByOrganizationId(args.organizationId)

    if (isFailure(allProjectsResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${allProjectsResult.error.message}` }],
        isError: true,
      }
    }

    let projects = allProjectsResult.data
    if (args.status) {
      projects = projects.filter(p => p.status === args.status)
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projects, null, 2),
        },
      ],
    }
  },
}

const getProjectAnalyticsTool = {
  name: 'get_project_analytics',
  description: 'Get analytics for a project',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
    },
    required: ['projectId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get project first to verify access
    const projectResult = await context.repositories.projects.findById(args.projectId)

    if (isFailure(projectResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${projectResult.error.message}` }],
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

    // Check if user has access to the organization
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
            text: 'Access denied: You do not have access to this organization',
          },
        ],
        isError: true,
      }
    }

    // Get tasks for the project
    const tasksResult = await context.repositories.tasks.findByProjectId(args.projectId)
    const tasks = isSuccess(tasksResult) ? tasksResult.data : []

    // Calculate basic analytics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
    const overdueTasks = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done',
    ).length

    const analytics = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      taskBreakdown: {
        todo: tasks.filter(t => t.status === 'todo').length,
        'in-progress': inProgressTasks,
        done: completedTasks,
        cancelled: tasks.filter(t => t.status === 'cancelled').length,
      },
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analytics, null, 2),
        },
      ],
    }
  },
}

const deleteProjectTool = {
  name: 'delete_project',
  description: 'Delete a project',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
    },
    required: ['projectId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get project first to verify access
    const projectResult = await context.repositories.projects.findById(args.projectId)

    if (isFailure(projectResult)) {
      return {
        content: [{ type: 'text', text: `Error: ${projectResult.error.message}` }],
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

    // Check if user has access to the organization
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
            text: 'Access denied: You do not have access to this organization',
          },
        ],
        isError: true,
      }
    }

    const result = await context.repositories.projects.delete(args.projectId)

    if (isFailure(result)) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Project deleted successfully',
        },
      ],
    }
  },
}

// Register tools
registerTool(createProjectTool)
registerTool(getProjectTool)
registerTool(updateProjectTool)
registerTool(listProjectsTool)
registerTool(getProjectAnalyticsTool)
registerTool(deleteProjectTool)
