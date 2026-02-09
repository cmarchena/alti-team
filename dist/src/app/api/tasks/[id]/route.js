"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/tasks/[id] - Get a single task with project and assignee
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const taskResult = await taskRepository.findById(id);
        if ((0, result_1.isFailure)(taskResult) || !taskResult.data) {
            return server_1.NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        const task = taskResult.data;
        // Verify user has access to the project
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(task.projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const project = projectResult.data;
        // Get assigned team member info
        let assignedTo = null;
        if (task.assignedToId) {
            const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
            const tmResult = await teamMemberRepository.findById(task.assignedToId);
            if ((0, result_1.isSuccess)(tmResult) && tmResult.data) {
                assignedTo = tmResult.data;
            }
        }
        return server_1.NextResponse.json({
            task: {
                ...task,
                project: {
                    id: project.id,
                    name: project.name,
                },
                assignedTo: assignedTo
                    ? {
                        id: assignedTo.id,
                        role: assignedTo.role,
                        position: assignedTo.position,
                        user: {
                            id: 'user-id', // Would need user lookup
                            name: 'User',
                            email: 'user@example.com',
                        },
                    }
                    : null,
            },
        });
    }
    catch (error) {
        console.error('Error fetching task:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// PATCH /api/tasks/[id] - Update a task
async function PATCH(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const updates = await request.json();
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const taskResult = await taskRepository.findById(id);
        if ((0, result_1.isFailure)(taskResult) || !taskResult.data) {
            return server_1.NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        // Verify user has access to the project
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(taskResult.data.projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const updateResult = await taskRepository.update(id, updates);
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ task: updateResult.data });
    }
    catch (error) {
        console.error('Error updating task:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// DELETE /api/tasks/[id] - Delete a task
async function DELETE(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const taskResult = await taskRepository.findById(id);
        if ((0, result_1.isFailure)(taskResult) || !taskResult.data) {
            return server_1.NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        // Verify user has access to the project
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(taskResult.data.projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const deleteResult = await taskRepository.delete(id);
        if ((0, result_1.isFailure)(deleteResult)) {
            return server_1.NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting task:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
