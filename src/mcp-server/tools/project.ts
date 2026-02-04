import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

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
      startDate: { type: 'string', description: 'Project start date (ISO format)' },
      endDate: { type: 'string', description: 'Project end date (ISO format)' },
      status: { 
        type: 'string', 
        description: 'Project status',
        enum: ['planning', 'active', 'on-hold', 'completed'] 
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
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this organization' }],
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

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const project = result.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            organizationId: project.organizationId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          }, null, 2),
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

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const project = result.value

    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Validate user has access to the project's organization
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            organizationId: project.organizationId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          }, null, 2),
        },
      ],
    }
  },
}

const updateProjectTool = {
  name: 'update_project',
  description: 'Update project information',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      name: { type: 'string', description: 'Project name' },
      description: { type: 'string', description: 'Project description' },
      status: { 
        type: 'string', 
        description: 'Project status',
        enum: ['planning', 'active', 'on-hold', 'completed'] 
      },
      startDate: { type: 'string', description: 'Project start date (ISO format)' },
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

    // Get existing project to validate organization access
    const existingProject = await context.repositories.projects.findById(args.projectId)

    if (existingProject.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${existingProject.error.message}` }],
        isError: true,
      }
    }

    const project = existingProject.value

    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Validate user has access to the project's organization
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

    // Build update data
    const updateData: any = {}
    if (args.name !== undefined) updateData.name = args.name
    if (args.description !== undefined) updateData.description = args.description
    if (args.status !== undefined) updateData.status = args.status
    if (args.startDate !== undefined) updateData.startDate = new Date(args.startDate)
    if (args.endDate !== undefined) updateData.endDate = new Date(args.endDate)

    const result = await context.repositories.projects.update(args.projectId, updateData)

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
          text: 'Project updated successfully',
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

    // Get existing project to validate organization access
    const existingProject = await context.repositories.projects.findById(args.projectId)

    if (existingProject.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${existingProject.error.message}` }],
        isError: true,
      }
    }

    const project = existingProject.value

    if (!project) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Validate user has access to the project's organization
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

    const result = await context.repositories.projects.delete(args.projectId)

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
          text: 'Project deleted successfully',
        },
      ],
    }
  },
}

const listProjectsTool = {
  name: 'list_projects',
  description: 'List projects with optional filters',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Filter by organization ID' },
      status: { 
        type: 'string', 
        description: 'Filter by project status',
        enum: ['planning', 'active', 'on-hold', 'completed'] 
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

    // If organizationId is provided, validate access
    if (args.organizationId) {
      const hasAccess = await validateOrganizationAccess(
        context.userId,
        args.organizationId,
        context
      )

      if (!hasAccess) {
        return {
          content: [{ type: 'text', text: 'Access denied: User does not have access to this organization' }],
          isError: true,
        }
      }
    }

    // Get all projects and filter
    // Note: Current repository doesn't support filtering, so we fetch all and filter in memory
    const allProjectsResult = await context.repositories.projects.findByOrganizationId(
      args.organizationId || 'all' // This will need to be handled properly
    )

    if (allProjectsResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${allProjectsResult.error.message}` }],
        isError: true,
      }
    }

    let projects = allProjectsResult.value

    // Apply filters
    if (args.status) {
      projects = projects.filter(p => p.status === args.status)
    }

    if (args.limit) {
      projects = projects.slice(0, args.limit)
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            organizationId: p.organizationId,
            createdAt: p.createdAt,
          })), null, 2),
        },
      ],
    }
  },
}

// Create Project from Template Tool
const createProjectFromTemplateTool = {
  name: 'create_project_from_template',
  description: 'Create a project from a template',
  inputSchema: {
    type: 'object',
    properties: {
      templateId: { type: 'string', description: 'Template ID' },
      organizationId: { type: 'string', description: 'Organization ID' },
      name: { type: 'string', description: 'Project name' },
      customizations: { 
        type: 'object', 
        description: 'Customizations for the template',
        properties: {
          description: { type: 'string' },
          status: { 
            type: 'string', 
            enum: ['planning', 'active', 'on-hold', 'completed'] 
          },
          startDate: { type: 'string', description: 'Project start date (ISO format)' },
          endDate: { type: 'string', description: 'Project end date (ISO format)' },
        }
      },
    },
    required: ['templateId', 'organizationId', 'name'],
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
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this organization' }],
        isError: true,
      }
    }

    // Note: Current implementation doesn't have actual templates
    // For now, we'll create a basic project with template-like structure
    // In a real implementation, this would fetch a template and apply it

    const createData: any = {
      name: args.name,
      description: args.customizations?.description || 'Project created from template',
      organizationId: args.organizationId,
      status: args.customizations?.status || 'planning',
    }

    if (args.customizations?.startDate) createData.startDate = new Date(args.customizations.startDate)
    if (args.customizations?.endDate) createData.endDate = new Date(args.customizations.endDate)

    const result = await context.repositories.projects.create(createData)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const project = result.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            organizationId: project.organizationId,
            createdAt: project.createdAt,
            message: 'Project created from template successfully',
          }, null, 2),
        },
      ],
    }
  },
}

// List Project Templates Tool
const listProjectTemplatesTool = {
  name: 'list_project_templates',
  description: 'List available project templates',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Filter by organization ID' },
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

    // If organizationId is provided, validate access
    if (args.organizationId) {
      const hasAccess = await validateOrganizationAccess(
        context.userId,
        args.organizationId,
        context
      )

      if (!hasAccess) {
        return {
          content: [{ type: 'text', text: 'Access denied: User does not have access to this organization' }],
          isError: true,
        }
      }
    }

    // Note: Current implementation doesn't have actual templates
    // Return a placeholder list of common project templates
    const templates = [
      {
        id: 'template-software-dev',
        name: 'Software Development Project',
        description: 'Template for software development projects with phases for design, development, testing, and deployment',
        organizationId: args.organizationId || 'global',
      },
      {
        id: 'template-marketing-campaign',
        name: 'Marketing Campaign',
        description: 'Template for marketing campaigns with phases for planning, content creation, launch, and analysis',
        organizationId: args.organizationId || 'global',
      },
      {
        id: 'template-product-launch',
        name: 'Product Launch',
        description: 'Template for product launches covering market research, development, launch, and post-launch review',
        organizationId: args.organizationId || 'global',
      },
    ]

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(templates, null, 2),
        },
      ],
    }
  },
}

// Get Project Analytics Tool
const getProjectAnalyticsTool = {
  name: 'get_project_analytics',
  description: 'Get analytics for a project',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      metrics: { 
        type: 'array', 
        description: 'Specific metrics to include',
        items: { 
          type: 'string', 
          enum: ['completion', 'velocity', 'burndown'] 
        }
      },
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

    // Get project to validate access
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

    // Validate user has access to the project's organization
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

    // Get all tasks for the project
    const tasksResult = await context.repositories.tasks.findByProjectId(args.projectId)
    const tasks = tasksResult.isOk() ? tasksResult.value : []
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
    const todoTasks = tasks.filter(t => t.status === 'todo').length
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0

    // Calculate velocity (tasks completed per day)
    const now = new Date()
    const projectStart = project.startDate ? new Date(project.startDate) : now
    const daysActive = Math.max(1, Math.floor((now.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)))
    const velocity = completedTasks / daysActive

    // Build response based on requested metrics or include all
    const requestedMetrics = args.metrics || ['completion', 'velocity', 'burndown']
    const analytics: any = {}

    if (requestedMetrics.includes('completion')) {
      analytics.completion = {
        rate: completionRate.toFixed(2) + '%',
        completedTasks,
        totalTasks,
        statusDistribution: {
          completed: completedTasks,
          'in-progress': inProgressTasks,
          todo: todoTasks,
        }
      }
    }

    if (requestedMetrics.includes('velocity')) {
      analytics.velocity = {
        tasksPerDay: velocity.toFixed(2),
        daysActive,
        projectedCompletion: velocity > 0 ? Math.ceil((totalTasks - completedTasks) / velocity) + ' days' : 'N/A',
      }
    }

    if (requestedMetrics.includes('burndown')) {
      analytics.burndown = {
        remainingWork: totalTasks - completedTasks,
        idealBurndown: 'Ideal burndown chart would be calculated with historical data',
        currentTrend: velocity > 0 ? 'On track' : 'No progress',
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectId: args.projectId,
            projectName: project.name,
            analytics,
          }, null, 2),
        },
      ],
    }
  },
}

// Get Project Progress Tool
const getProjectProgressTool = {
  name: 'get_project_progress',
  description: 'Get current progress of a project',
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

    // Get project to validate access
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

    // Validate user has access to the project's organization
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

    // Get all tasks for the project
    const tasksResult = await context.repositories.tasks.findByProjectId(args.projectId)
    const tasks = tasksResult.isOk() ? tasksResult.value : []
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0

    // Calculate time progress
    const now = new Date()
    const startDate = project.startDate ? new Date(project.startDate) : now
    const endDate = project.endDate ? new Date(project.endDate) : null
    
    let timeProgress = 0
    let timeStatus = 'Not started'
    
    if (endDate) {
      const totalDuration = endDate.getTime() - startDate.getTime()
      const elapsedDuration = now.getTime() - startDate.getTime()
      timeProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100))
      
      if (timeProgress < 30) timeStatus = 'Early stage'
      else if (timeProgress < 70) timeStatus = 'Mid progress'
      else if (timeProgress < 100) timeStatus = 'Final stage'
      else timeStatus = 'Time completed'
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectId: args.projectId,
            projectName: project.name,
            status: project.status,
            progress: {
              taskCompletion: completionRate.toFixed(2) + '%',
              timeProgress: timeProgress.toFixed(2) + '%',
              overallProgress: (((completionRate + timeProgress) / 2).toFixed(2)) + '%',
              timeStatus,
              completedTasks,
              totalTasks,
            },
          }, null, 2),
        },
      ],
    }
  },
}

// Register all project tools
registerTool(createProjectTool)
registerTool(getProjectTool)
registerTool(updateProjectTool)
registerTool(deleteProjectTool)
registerTool(listProjectsTool)
registerTool(createProjectFromTemplateTool)
registerTool(listProjectTemplatesTool)
registerTool(getProjectAnalyticsTool)
registerTool(getProjectProgressTool)