"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const result_1 = require("../../lib/result");
const index_js_1 = require("../index.js");
const auth_js_1 = require("../auth.js");
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
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        const { taskIds, updates } = args;
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return {
                content: [{ type: 'text', text: 'taskIds must be a non-empty array' }],
                isError: true,
            };
        }
        const results = [];
        let accessErrors = [];
        for (const taskId of taskIds) {
            try {
                const taskResult = await context.repositories.tasks.findById(taskId);
                if ((0, result_1.isFailure)(taskResult) || !taskResult.data) {
                    results.push({ taskId, success: false, error: 'Task not found' });
                    continue;
                }
                const task = taskResult.data;
                const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, task.projectId, context);
                if (!hasAccess) {
                    accessErrors.push(taskId);
                    continue;
                }
                const updateData = {};
                if (updates.status !== undefined)
                    updateData.status = updates.status;
                if (updates.priority !== undefined)
                    updateData.priority = updates.priority;
                if (updates.assigneeId !== undefined)
                    updateData.assigneeId = updates.assigneeId;
                const updateResult = await context.repositories.tasks.update(taskId, updateData);
                if ((0, result_1.isFailure)(updateResult)) {
                    results.push({
                        taskId,
                        success: false,
                        error: updateResult.error.message,
                    });
                }
                else {
                    results.push({ taskId, success: true });
                }
            }
            catch (error) {
                results.push({
                    taskId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        let message = `Updated ${successful} of ${taskIds.length} tasks`;
        if (failed > 0) {
            const failedIds = results.filter((r) => !r.success).map((r) => r.taskId);
            message += `\nFailed tasks: ${failedIds.join(', ')}`;
        }
        if (accessErrors.length > 0) {
            message += `\nAccess denied for ${accessErrors.length} tasks`;
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        message,
                        total: taskIds.length,
                        successful,
                        failed,
                        results,
                    }, null, 2),
                },
            ],
        };
    },
};
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
    handler: async (args, context) => {
        if (!context.userId) {
            return {
                content: [{ type: 'text', text: 'Authentication required' }],
                isError: true,
            };
        }
        const { taskIds, assigneeId } = args;
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return {
                content: [{ type: 'text', text: 'taskIds must be a non-empty array' }],
                isError: true,
            };
        }
        const userResult = await context.repositories.users.findById(assigneeId);
        if ((0, result_1.isFailure)(userResult) || !userResult.data) {
            return {
                content: [{ type: 'text', text: 'Assignee user not found' }],
                isError: true,
            };
        }
        const assignee = userResult.data;
        const results = [];
        for (const taskId of taskIds) {
            try {
                const taskResult = await context.repositories.tasks.findById(taskId);
                if ((0, result_1.isFailure)(taskResult) || !taskResult.data) {
                    results.push({ taskId, success: false, error: 'Task not found' });
                    continue;
                }
                const task = taskResult.data;
                const hasAccess = await (0, auth_js_1.validateOrganizationAccess)(context.userId, task.projectId, context);
                if (!hasAccess) {
                    results.push({ taskId, success: false, error: 'Access denied' });
                    continue;
                }
                const updateResult = await context.repositories.tasks.update(taskId, {
                    assignedToId: assigneeId,
                });
                if ((0, result_1.isFailure)(updateResult)) {
                    results.push({
                        taskId,
                        success: false,
                        error: updateResult.error.message,
                    });
                }
                else {
                    results.push({ taskId, success: true });
                }
            }
            catch (error) {
                results.push({
                    taskId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
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
                    }, null, 2),
                },
            ],
        };
    },
};
(0, index_js_1.registerTool)(batchUpdateTasksTool);
(0, index_js_1.registerTool)(batchAssignTasksTool);
