import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

// Create Resource Tool
const createResourceTool = {
  name: 'create_resource',
  description: 'Create a new resource (file, link, note)',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID (optional)' },
      taskId: { type: 'string', description: 'Task ID (optional)' },
      type: { type: 'string', description: 'Resource type', enum: ['file', 'link', 'note'] },
      name: { type: 'string', description: 'Resource name' },
      content: { type: 'string', description: 'Content for notes/links' },
      fileUrl: { type: 'string', description: 'File URL for files' },
      metadata: { type: 'object', description: 'Additional metadata' },
    },
    required: ['type', 'name'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Validate that either projectId or taskId is provided
    if (!args.projectId && !args.taskId) {
      return {
        content: [{ type: 'text', text: 'Either projectId or taskId must be provided' }],
        isError: true,
      }
    }

    // If taskId is provided, get the projectId from the task
    let targetProjectId = args.projectId
    if (args.taskId && !args.projectId) {
      const taskResult = await context.repositories.tasks.findById(args.taskId)
      if (taskResult.isErr() || !taskResult.value) {
        return {
          content: [{ type: 'text', text: 'Task not found' }],
          isError: true,
        }
      }
      targetProjectId = taskResult.value.projectId
    }

    // Validate the project exists and user has access
    const projectResult = await context.repositories.projects.findById(targetProjectId)
    if (projectResult.isErr() || !projectResult.value) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, projectResult.value.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    // Validate content based on type
    if (args.type === 'file' && !args.fileUrl) {
      return {
        content: [{ type: 'text', text: 'fileUrl is required for file resources' }],
        isError: true,
      }
    }

    if ((args.type === 'link' || args.type === 'note') && !args.content) {
      return {
        content: [{ type: 'text', text: 'content is required for link and note resources' }],
        isError: true,
      }
    }

    const result = await context.repositories.resources.create({
      name: args.name,
      type: args.type,
      url: args.type === 'file' ? args.fileUrl : undefined,
      projectId: targetProjectId,
      uploadedById: context.userId,
      metadata: args.metadata || {},
    })

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const resource = result.value
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: resource.id,
            name: resource.name,
            type: resource.type,
            url: resource.url,
            projectId: resource.projectId,
            taskId: args.taskId,
            uploadedById: resource.uploadedById,
            metadata: resource.metadata,
            createdAt: resource.createdAt,
          }, null, 2),
        },
      ],
    }
  },
}

// Get Resource Tool
const getResourceTool = {
  name: 'get_resource',
  description: 'Get resource details',
  inputSchema: {
    type: 'object',
    properties: {
      resourceId: { type: 'string', description: 'Resource ID' },
    },
    required: ['resourceId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const result = await context.repositories.resources.findById(args.resourceId)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const resource = result.value
    if (!resource) {
      return {
        content: [{ type: 'text', text: 'Resource not found' }],
        isError: true,
      }
    }

    // Get the project to check organization access
    const projectResult = await context.repositories.projects.findById(resource.projectId)
    if (projectResult.isErr() || !projectResult.value) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, projectResult.value.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: resource.id,
            name: resource.name,
            type: resource.type,
            url: resource.url,
            projectId: resource.projectId,
            uploadedById: resource.uploadedById,
            metadata: resource.metadata,
            createdAt: resource.createdAt,
          }, null, 2),
        },
      ],
    }
  },
}

// List Resources Tool
const listResourcesTool = {
  name: 'list_resources',
  description: 'List resources',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Filter by project ID (optional)' },
      taskId: { type: 'string', description: 'Filter by task ID (optional)' },
      type: { type: 'string', description: 'Filter by resource type (optional)', enum: ['file', 'link', 'note'] },
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

    let resourcesResult

    if (args.taskId) {
      // If taskId is provided, get resources for that task's project
      const taskResult = await context.repositories.tasks.findById(args.taskId)
      if (taskResult.isErr() || !taskResult.value) {
        return {
          content: [{ type: 'text', text: 'Task not found' }],
          isError: true,
        }
      }
      resourcesResult = await context.repositories.resources.findByProjectId(taskResult.value.projectId)
    } else if (args.projectId) {
      // If projectId is provided, get resources for that project
      resourcesResult = await context.repositories.resources.findByProjectId(args.projectId)
    } else {
      // If neither is provided, we would need to get all resources the user has access to
      // For now, we'll return an error as this would be complex without organization-level resource listing
      return {
        content: [{ type: 'text', text: 'Either projectId or taskId must be provided' }],
        isError: true,
      }
    }

    if (resourcesResult.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${resourcesResult.error.message}` }],
        isError: true,
      }
    }

    let resources = resourcesResult.value

    // Filter by type if specified
    if (args.type) {
      resources = resources.filter(r => r.type === args.type)
    }

    // Get the project to check organization access
    const projectId = args.projectId || (await context.repositories.tasks.findById(args.taskId)).value?.projectId
    const projectResult = await context.repositories.projects.findById(projectId)
    if (projectResult.isErr() || !projectResult.value) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, projectResult.value.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(resources.map(r => ({
            id: r.id,
            name: r.name,
            type: r.type,
            url: r.url,
            projectId: r.projectId,
            uploadedById: r.uploadedById,
            metadata: r.metadata,
            createdAt: r.createdAt,
          })), null, 2),
        },
      ],
    }
  },
}

// Delete Resource Tool
const deleteResourceTool = {
  name: 'delete_resource',
  description: 'Delete a resource',
  inputSchema: {
    type: 'object',
    properties: {
      resourceId: { type: 'string', description: 'Resource ID' },
    },
    required: ['resourceId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    // Get the resource first to check access
    const resourceResult = await context.repositories.resources.findById(args.resourceId)
    if (resourceResult.isErr() || !resourceResult.value) {
      return {
        content: [{ type: 'text', text: 'Resource not found' }],
        isError: true,
      }
    }

    const resource = resourceResult.value

    // Get the project to check organization access
    const projectResult = await context.repositories.projects.findById(resource.projectId)
    if (projectResult.isErr() || !projectResult.value) {
      return {
        content: [{ type: 'text', text: 'Project not found' }],
        isError: true,
      }
    }

    // Check if user has access to the organization
    const hasAccess = await validateOrganizationAccess(context.userId, projectResult.value.organizationId, context)
    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
        isError: true,
      }
    }

    const result = await context.repositories.resources.delete(args.resourceId)

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
          text: 'Resource deleted successfully',
        },
      ],
    }
  },
}

// Register tools
registerTool(createResourceTool)
registerTool(getResourceTool)
registerTool(listResourcesTool)
registerTool(deleteResourceTool)