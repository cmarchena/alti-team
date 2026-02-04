import { MCPServerContext, registerTool } from '../index.js'
import { validateOrganizationAccess } from '../auth.js'

// Department CRUD Tools

const createDepartmentTool = {
  name: 'create_department',
  description: 'Create a new department',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
      name: { type: 'string', description: 'Department name' },
      parentDepartmentId: { type: 'string', description: 'Parent department ID (optional)' },
      description: { type: 'string', description: 'Department description' },
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

    // Validate parent department if provided
    if (args.parentDepartmentId) {
      const parentResult = await context.repositories.departments.findById(args.parentDepartmentId)
      if (parentResult.isErr() || !parentResult.value) {
        return {
          content: [{ type: 'text', text: 'Parent department not found' }],
          isError: true,
        }
      }
    }

    const result = await context.repositories.departments.create({
      name: args.name,
      description: args.description || '',
      organizationId: args.organizationId,
      parentId: args.parentDepartmentId || undefined,
    })

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const department = result.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: department.id,
            name: department.name,
            description: department.description,
            organizationId: department.organizationId,
            parentId: department.parentId,
            createdAt: department.createdAt,
            updatedAt: department.updatedAt,
          }, null, 2),
        },
      ],
    }
  },
}

const getDepartmentTool = {
  name: 'get_department',
  description: 'Get department details',
  inputSchema: {
    type: 'object',
    properties: {
      departmentId: { type: 'string', description: 'Department ID' },
    },
    required: ['departmentId'],
  },
  handler: async (args: any, context: MCPServerContext) => {
    if (!context.userId) {
      return {
        content: [{ type: 'text', text: 'Authentication required' }],
        isError: true,
      }
    }

    const result = await context.repositories.departments.findById(args.departmentId)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const department = result.value

    if (!department) {
      return {
        content: [{ type: 'text', text: 'Department not found' }],
        isError: true,
      }
    }

    // Validate user has access to the department's organization
    const hasAccess = await validateOrganizationAccess(
      context.userId,
      department.organizationId,
      context
    )

    if (!hasAccess) {
      return {
        content: [{ type: 'text', text: 'Access denied: User does not have access to this department' }],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: department.id,
            name: department.name,
            description: department.description,
            organizationId: department.organizationId,
            parentId: department.parentId,
            createdAt: department.createdAt,
            updatedAt: department.updatedAt,
          }, null, 2),
        },
      ],
    }
  },
}

const listDepartmentsTool = {
  name: 'list_departments',
  description: 'List departments in organization',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
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

    const result = await context.repositories.departments.findByOrganizationId(args.organizationId)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const departments = result.value

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(departments.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            organizationId: d.organizationId,
            parentId: d.parentId,
            createdAt: d.createdAt,
          })), null, 2),
        },
      ],
    }
  },
}

const getDepartmentHierarchyTool = {
  name: 'get_department_hierarchy',
  description: 'Get organizational hierarchy',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: { type: 'string', description: 'Organization ID' },
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

    const result = await context.repositories.departments.findByOrganizationId(args.organizationId)

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      }
    }

    const departments = result.value

    // Build hierarchy structure
    const buildHierarchy = (deptId: string | null = null): any => {
      const children = departments.filter(d => d.parentId === deptId)
      
      return children.map(child => ({
        id: child.id,
        name: child.name,
        description: child.description,
        children: buildHierarchy(child.id),
      }))
    }

    const hierarchy = buildHierarchy()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            organizationId: args.organizationId,
            hierarchy: hierarchy,
          }, null, 2),
        },
      ],
    }
  },
}

// Register department tools
registerTool(createDepartmentTool)
registerTool(getDepartmentTool)
registerTool(listDepartmentsTool)
registerTool(getDepartmentHierarchyTool)