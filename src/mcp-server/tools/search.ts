import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

// Global Search Tool
const globalSearchTool = {
  name: 'global_search',
  description: 'Search across projects, tasks, resources, and more',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      entityTypes: {
        type: 'array',
        description: 'Entity types to search',
        items: {
          type: 'string',
          enum: ['project', 'task', 'resource', 'user'],
        },
      },
      organizationId: { type: 'string', description: 'Search within specific organization' },
      limit: { type: 'number', description: 'Maximum number of results per entity type' },
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

    const query = args.query.toLowerCase()
    const limit = args.limit || 10
    const entityTypes = args.entityTypes || ['project', 'task', 'resource', 'user']
    const results: Record<string, any[]> = {}

    // If organizationId is provided, check access
    if (args.organizationId) {
      const hasAccess = await validateOrganizationAccess(context.userId, args.organizationId, context)
      if (!hasAccess) {
        return {
          content: [{ type: 'text', text: 'Access denied. You are not a member of this organization.' }],
          isError: true,
        }
      }
    }

    // Search projects
    if (entityTypes.includes('project')) {
      try {
        // Get all projects the user has access to
        const membersResult = await context.repositories.teamMembers.findByUserId(context.userId)
        if (membersResult.isOk()) {
          const orgIds = membersResult.value.map(m => m.organizationId)
          const projectResults = []
          
          for (const orgId of orgIds) {
            const projectsResult = await context.repositories.projects.findByOrganizationId(orgId)
            if (projectsResult.isOk()) {
              projectResults.push(...projectsResult.value)
            }
          }
          
          const filteredProjects = projectResults.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.description && p.description.toLowerCase().includes(query))
          ).slice(0, limit)
          
          results.projects = filteredProjects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            organizationId: p.organizationId,
            status: p.status,
            type: 'project',
          }))
        }
      } catch (error) {
        console.error('Error searching projects:', error)
      }
    }

    // Search tasks
    if (entityTypes.includes('task')) {
      try {
        // Get all projects the user has access to
        const membersResult = await context.repositories.teamMembers.findByUserId(context.userId)
        if (membersResult.isOk()) {
          const orgIds = membersResult.value.map(m => m.organizationId)
          const taskResults = []
          
          for (const orgId of orgIds) {
            const projectsResult = await context.repositories.projects.findByOrganizationId(orgId)
            if (projectsResult.isOk()) {
              for (const project of projectsResult.value) {
                const tasksResult = await context.repositories.tasks.findByProjectId(project.id)
                if (tasksResult.isOk()) {
                  taskResults.push(...tasksResult.value)
                }
              }
            }
          }
          
          const filteredTasks = taskResults.filter(t => 
            t.title.toLowerCase().includes(query) || 
            (t.description && t.description.toLowerCase().includes(query))
          ).slice(0, limit)
          
          results.tasks = filteredTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            projectId: t.projectId,
            status: t.status,
            priority: t.priority,
            type: 'task',
          }))
        }
      } catch (error) {
        console.error('Error searching tasks:', error)
      }
    }

    // Search resources
    if (entityTypes.includes('resource')) {
      try {
        // Get all projects the user has access to
        const membersResult = await context.repositories.teamMembers.findByUserId(context.userId)
        if (membersResult.isOk()) {
          const orgIds = membersResult.value.map(m => m.organizationId)
          const resourceResults = []
          
          for (const orgId of orgIds) {
            const projectsResult = await context.repositories.projects.findByOrganizationId(orgId)
            if (projectsResult.isOk()) {
              for (const project of projectsResult.value) {
                const resourcesResult = await context.repositories.resources.findByProjectId(project.id)
                if (resourcesResult.isOk()) {
                  resourceResults.push(...resourcesResult.value)
                }
              }
            }
          }
          
          const filteredResources = resourceResults.filter(r => 
            r.name.toLowerCase().includes(query) || 
            (r.metadata && JSON.stringify(r.metadata).toLowerCase().includes(query))
          ).slice(0, limit)
          
          results.resources = filteredResources.map(r => ({
            id: r.id,
            name: r.name,
            type: r.type,
            projectId: r.projectId,
            uploadedById: r.uploadedById,
            type: 'resource',
          }))
        }
      } catch (error) {
        console.error('Error searching resources:', error)
      }
    }

    // Search users
    if (entityTypes.includes('user')) {
      try {
        const usersResult = await context.repositories.users.search(query)
        if (usersResult.isOk()) {
          const filteredUsers = usersResult.value.slice(0, limit)
          results.users = filteredUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            type: 'user',
          }))
        }
      } catch (error) {
        console.error('Error searching users:', error)
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: args.query,
            results: results,
            counts: {
              projects: results.projects ? results.projects.length : 0,
              tasks: results.tasks ? results.tasks.length : 0,
              resources: results.resources ? results.resources.length : 0,
              users: results.users ? results.users.length : 0,
            },
          }, null, 2),
        },
      ],
    }
  },
}

// Register tools
registerTool(globalSearchTool)