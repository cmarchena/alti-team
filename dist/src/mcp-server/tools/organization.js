"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const result_1 = require("../../lib/result");
const index_js_1 = require("../index.js");
const auth_js_1 = require("../auth.js");
// Create Organization Tool
const createOrganizationTool = {
    name: 'create_organization',
    description: 'Create a new organization',
    inputSchema: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Organization name' },
            description: { type: 'string', description: 'Organization description' },
        },
        required: ['name'],
    },
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        const result = await context.repositories.organizations.create({
            name: args.name,
            description: args.description || '',
            ownerId: context.userId,
        });
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        const organization = result.data;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        id: organization.id,
                        name: organization.name,
                        description: organization.description,
                        createdAt: organization.createdAt,
                    }, null, 2),
                },
            ],
        };
    },
};
// Get Organization Tool
const getOrganizationTool = {
    name: 'get_organization',
    description: 'Get organization details',
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
        // Check if user has access to the organization
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, args.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied. You are not a member of this organization.',
                    },
                ],
                isError: true,
            };
        }
        const result = await context.repositories.organizations.findById(args.organizationId);
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        const organization = result.data;
        if (!organization) {
            return {
                content: [{ type: 'text', text: 'Organization not found' }],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        id: organization.id,
                        name: organization.name,
                        description: organization.description,
                        ownerId: organization.ownerId,
                        createdAt: organization.createdAt,
                        updatedAt: organization.updatedAt,
                    }, null, 2),
                },
            ],
        };
    },
};
// Update Organization Tool
const updateOrganizationTool = {
    name: 'update_organization',
    description: 'Update organization information',
    inputSchema: {
        type: 'object',
        properties: {
            organizationId: { type: 'string', description: 'Organization ID' },
            name: { type: 'string', description: 'New organization name' },
            description: {
                type: 'string',
                description: 'New organization description',
            },
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
        // Check if user owns the organization
        const isOwner = await (0, auth_js_1.validateOrganizationOwnership)(context.userId, args.organizationId, context);
        if (!isOwner) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied. Only organization owners can update organization information.',
                    },
                ],
                isError: true,
            };
        }
        const updateData = {};
        if (args.name !== undefined)
            updateData.name = args.name;
        if (args.description !== undefined)
            updateData.description = args.description;
        const result = await context.repositories.organizations.update(args.organizationId, updateData);
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: 'Organization updated successfully',
                },
            ],
        };
    },
};
// List My Organizations Tool
const listMyOrganizationsTool = {
    name: 'list_my_organizations',
    description: 'List all organizations the user belongs to',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        // Find organizations where user is owner
        const ownedOrgsResult = await context.repositories.organizations.findByOwnerId(context.userId);
        // Find organizations where user is a member
        const memberOrgsResult = await context.repositories.teamMembers.findByUserId(context.userId);
        let organizations = [];
        if ((0, result_1.isSuccess)(ownedOrgsResult)) {
            organizations = ownedOrgsResult.data.map((org) => ({
                ...org,
                role: 'owner',
            }));
        }
        if ((0, result_1.isSuccess)(memberOrgsResult)) {
            const memberOrgs = memberOrgsResult.data;
            for (const membership of memberOrgs) {
                const orgResult = await context.repositories.organizations.findById(membership.organizationId);
                if ((0, result_1.isSuccess)(orgResult) && orgResult.data) {
                    organizations.push({
                        ...orgResult.data,
                        role: membership.role,
                    });
                }
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(organizations.map((org) => ({
                        id: org.id,
                        name: org.name,
                        description: org.description,
                        role: org.role,
                    })), null, 2),
                },
            ],
        };
    },
};
// Get Organization Dashboard Tool
const getOrganizationDashboardTool = {
    name: 'get_organization_dashboard',
    description: 'Get dashboard data for an organization',
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
        // Check if user has access to the organization
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, args.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied. You are not a member of this organization.',
                    },
                ],
                isError: true,
            };
        }
        // Get basic organization info
        const orgResult = await context.repositories.organizations.findById(args.organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return {
                content: [{ type: 'text', text: 'Organization not found' }],
                isError: true,
            };
        }
        const organization = orgResult.data;
        // Get projects count and status distribution
        const projectsResult = await context.repositories.projects.findByOrganizationId(args.organizationId);
        const projects = (0, result_1.isSuccess)(projectsResult) ? projectsResult.data : [];
        const projectStatusCounts = {};
        projects.forEach((project) => {
            projectStatusCounts[project.status] =
                (projectStatusCounts[project.status] || 0) + 1;
        });
        // Get members count
        const membersResult = await context.repositories.teamMembers.findByOrganizationId(args.organizationId);
        const members = (0, result_1.isSuccess)(membersResult) ? membersResult.data : [];
        // Get departments count
        const departmentsResult = await context.repositories.departments.findByOrganizationId(args.organizationId);
        const departments = (0, result_1.isSuccess)(departmentsResult)
            ? departmentsResult.data
            : [];
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        organization: {
                            id: organization.id,
                            name: organization.name,
                            description: organization.description,
                        },
                        metrics: {
                            projects: projects.length,
                            members: members.length,
                            departments: departments.length,
                            projectStatus: projectStatusCounts,
                        },
                    }, null, 2),
                },
            ],
        };
    },
};
// Get Organization Metrics Tool
const getOrganizationMetricsTool = {
    name: 'get_organization_metrics',
    description: 'Get key metrics for an organization',
    inputSchema: {
        type: 'object',
        properties: {
            organizationId: { type: 'string', description: 'Organization ID' },
            period: {
                type: 'string',
                description: 'Time period (week, month, quarter)',
                enum: ['week', 'month', 'quarter'],
            },
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
        // Check if user has access to the organization
        const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, args.organizationId, context);
        if (!hasAccess) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied. You are not a member of this organization.',
                    },
                ],
                isError: true,
            };
        }
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();
        switch (args.period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1); // Default to month
        }
        // Get projects created in the period
        const projectsResult = await context.repositories.projects.findByOrganizationId(args.organizationId);
        const projects = (0, result_1.isSuccess)(projectsResult) ? projectsResult.data : [];
        const recentProjects = projects.filter((p) => new Date(p.createdAt) >= startDate);
        // Get tasks created in the period
        const allTasksResult = await Promise.all(projects.map((p) => context.repositories.tasks.findByProjectId(p.id)));
        const allTasks = allTasksResult
            .filter((r) => (0, result_1.isSuccess)(r))
            .flatMap((r) => r.data);
        const recentTasks = allTasks.filter((t) => new Date(t.createdAt) >= startDate);
        const completedTasks = recentTasks.filter((t) => t.status === 'done');
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        period: args.period || 'month',
                        startDate: startDate.toISOString(),
                        endDate: now.toISOString(),
                        metrics: {
                            newProjects: recentProjects.length,
                            newTasks: recentTasks.length,
                            completedTasks: completedTasks.length,
                            taskCompletionRate: projects.length > 0
                                ? ((completedTasks.length / recentTasks.length) *
                                    100).toFixed(2) + '%'
                                : '0%',
                        },
                    }, null, 2),
                },
            ],
        };
    },
};
// Delete Organization Tool
const deleteOrganizationTool = {
    name: 'delete_organization',
    description: 'Delete an organization (owner only)',
    inputSchema: {
        type: 'object',
        properties: {
            organizationId: {
                type: 'string',
                description: 'Organization ID to delete',
            },
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
        // Check if user owns the organization
        const isOwner = await (0, auth_js_1.validateOrganizationOwnership)(context.userId, args.organizationId, context);
        if (!isOwner) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Access denied. Only organization owners can delete organizations.',
                    },
                ],
                isError: true,
            };
        }
        const result = await context.repositories.organizations.delete(args.organizationId);
        if ((0, result_1.isFailure)(result)) {
            return {
                content: [{ type: 'text', text: `Error: ${result.error.message}` }],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: 'Organization deleted successfully',
                },
            ],
        };
    },
};
// Register tools
(0, index_js_1.registerTool)(createOrganizationTool);
(0, index_js_1.registerTool)(getOrganizationTool);
(0, index_js_1.registerTool)(updateOrganizationTool);
(0, index_js_1.registerTool)(deleteOrganizationTool);
(0, index_js_1.registerTool)(listMyOrganizationsTool);
(0, index_js_1.registerTool)(getOrganizationDashboardTool);
(0, index_js_1.registerTool)(getOrganizationMetricsTool);
