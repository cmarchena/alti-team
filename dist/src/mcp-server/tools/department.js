"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const result_1 = require("../../lib/result");
const index_js_1 = require("../index.js");
const auth_js_1 = require("../auth.js");
// Department CRUD Tools
const createDepartmentTool = {
    name: 'create_department',
    description: 'Create a new department',
    inputSchema: {
        type: 'object',
        properties: {
            organizationId: { type: 'string', description: 'Organization ID' },
            name: { type: 'string', description: 'Department name' },
            parentDepartmentId: {
                type: 'string',
                description: 'Parent department ID (optional)',
            },
            description: { type: 'string', description: 'Department description' },
        },
        required: ['organizationId', 'name'],
    },
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        // Validate user has access to organization
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, args.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied: User does not have access to this organization',
                    },
                ],
                isError: true,
            };
        }
        // Validate parent department if provided
        if (args.parentDepartmentId) {
            const parentResult = await context.repositories.departments.findById(args.parentDepartmentId);
            if ((0, result_1.isFailure)(parentResult) || !parentResult.data) {
                return {
                    content: [{ type: 'text', text: 'Parent department not found' }],
                    isError: true,
                };
            }
        }
        const result = await context.repositories.departments.create({
            name: args.name,
            description: args.description || '',
            organizationId: args.organizationId,
            parentId: args.parentDepartmentId || undefined,
        });
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        const department = result.data;
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
        };
    },
};
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
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        const result = await context.repositories.departments.findById(args.departmentId);
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        const department = result.data;
        if (!department) {
            return {
                content: [{ type: 'text', text: 'Department not found' }],
                isError: true,
            };
        }
        // Validate user has access to the department's organization
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, department.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied: User does not have access to this department',
                    },
                ],
                isError: true,
            };
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
        };
    },
};
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
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        // Validate user has access to organization
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, args.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied: User does not have access to this organization',
                    },
                ],
                isError: true,
            };
        }
        const result = await context.repositories.departments.findByOrganizationId(args.organizationId);
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        const departments = result.data;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(departments.map((d) => ({
                        id: d.id,
                        name: d.name,
                        description: d.description,
                        organizationId: d.organizationId,
                        parentId: d.parentId,
                        createdAt: d.createdAt,
                    })), null, 2),
                },
            ],
        };
    },
};
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
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        // Validate user has access to organization
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, args.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied: User does not have access to this organization',
                    },
                ],
                isError: true,
            };
        }
        const result = await context.repositories.departments.findByOrganizationId(args.organizationId);
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        const departments = result.data;
        // Build hierarchy structure
        const buildHierarchy = (deptId = null) => {
            const children = departments.filter((d) => d.parentId === deptId);
            return children.map((child) => ({
                id: child.id,
                name: child.name,
                description: child.description,
                children: buildHierarchy(child.id),
            }));
        };
        const hierarchy = buildHierarchy();
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
        };
    },
};
// Update Department Tool
const updateDepartmentTool = {
    name: 'update_department',
    description: 'Update department information',
    inputSchema: {
        type: 'object',
        properties: {
            departmentId: { type: 'string', description: 'Department ID' },
            name: { type: 'string', description: 'Department name (optional)' },
            description: {
                type: 'string',
                description: 'Department description (optional)',
            },
            parentDepartmentId: {
                type: 'string',
                description: 'Parent department ID (optional, set to null to remove parent)',
            },
        },
        required: ['departmentId'],
    },
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        const result = await context.repositories.departments.findById(args.departmentId);
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        const department = result.data;
        if (!department) {
            return {
                content: [{ type: 'text', text: 'Department not found' }],
                isError: true,
            };
        }
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, department.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied: User does not have access to this department',
                    },
                ],
                isError: true,
            };
        }
        if (args.parentDepartmentId === 'null') {
            args.parentDepartmentId = null;
        }
        if (args.parentDepartmentId && args.parentDepartmentId !== department.id) {
            const parentResult = await context.repositories.departments.findById(args.parentDepartmentId);
            if ((0, result_1.isFailure)(parentResult) || !parentResult.data) {
                return {
                    content: [{ type: 'text', text: 'Parent department not found' }],
                    isError: true,
                };
            }
            if (parentResult.data.organizationId !== department.organizationId) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Parent department must be in the same organization',
                        },
                    ],
                    isError: true,
                };
            }
        }
        const updateResult = await context.repositories.departments.update(args.departmentId, {
            name: args.name,
            description: args.description,
            parentId: args.parentDepartmentId !== undefined
                ? args.parentDepartmentId
                : undefined,
        });
        if ((0, result_1.isFailure)(updateResult)) {
            return {
                content: [
                    { type: 'text', text: `Error: ${updateResult.error.message}` },
                ],
                isError: true,
            };
        }
        const updated = updateResult.data;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        id: updated.id,
                        name: updated.name,
                        description: updated.description,
                        organizationId: updated.organizationId,
                        parentId: updated.parentId,
                        updatedAt: updated.updatedAt,
                        message: 'Department updated successfully',
                    }, null, 2),
                },
            ],
        };
    },
};
// Delete Department Tool
const deleteDepartmentTool = {
    name: 'delete_department',
    description: 'Delete a department',
    inputSchema: {
        type: 'object',
        properties: {
            departmentId: { type: 'string', description: 'Department ID' },
        },
        required: ['departmentId'],
    },
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        const result = await context.repositories.departments.findById(args.departmentId);
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        const department = result.data;
        if (!department) {
            return {
                content: [{ type: 'text', text: 'Department not found' }],
                isError: true,
            };
        }
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, department.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied: User does not have access to this department',
                    },
                ],
                isError: true,
            };
        }
        const childrenResult = await context.repositories.departments.findByParentId(args.departmentId);
        if ((0, result_1.isSuccess)(childrenResult) && childrenResult.data.length > 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Cannot delete department with child departments. Please delete or reassign child departments first.',
                    },
                ],
                isError: true,
            };
        }
        const membersResult = await context.repositories.teamMembers.findByOrganizationId(department.organizationId);
        if ((0, result_1.isSuccess)(membersResult)) {
            const deptMembers = membersResult.data.filter((m) => m.departmentId === args.departmentId);
            if (deptMembers.length > 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Cannot delete department with ${deptMembers.length} members. Please reassign members to another department first.`,
                        },
                    ],
                    isError: true,
                };
            }
        }
        const deleteResult = await context.repositories.departments.delete(args.departmentId);
        if ((0, result_1.isFailure)(deleteResult)) {
            return {
                content: [
                    { type: 'text', text: `Error: ${deleteResult.error.message}` },
                ],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: 'Department deleted successfully',
                },
            ],
        };
    },
};
// Register department tools
(0, index_js_1.registerTool)(createDepartmentTool);
(0, index_js_1.registerTool)(getDepartmentTool);
(0, index_js_1.registerTool)(listDepartmentsTool);
(0, index_js_1.registerTool)(getDepartmentHierarchyTool);
(0, index_js_1.registerTool)(updateDepartmentTool);
(0, index_js_1.registerTool)(deleteDepartmentTool);
