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
// GET /api/projects/[id] - Get a single project with tasks, resources, and members
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(id);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const project = projectResult.data;
        // Get tasks
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const tasksResult = await taskRepository.findByProjectId(id);
        const tasks = (0, result_1.isSuccess)(tasksResult) ? tasksResult.data || [] : [];
        // Get resources
        const resourceRepository = (0, repositories_1.getResourceRepository)();
        const resourcesResult = await resourceRepository.findByProjectId(id);
        const resources = (0, result_1.isSuccess)(resourcesResult)
            ? resourcesResult.data || []
            : [];
        // Get project members (team members from the same organization)
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const membersResult = await teamMemberRepository.findByProjectId(id);
        const projectMembers = (0, result_1.isSuccess)(membersResult)
            ? membersResult.data || []
            : [];
        // Transform to expected format for frontend
        const projectMembersFormatted = projectMembers.map((tm) => ({
            id: tm.id,
            role: tm.role,
            teamMember: {
                id: tm.id,
                role: tm.role,
                position: tm.position,
                user: {
                    id: '',
                    name: '',
                    email: '',
                },
            },
        }));
        return server_1.NextResponse.json({
            project: {
                ...project,
                tasks,
                resources,
                projectMembers: projectMembersFormatted,
            },
        });
    }
    catch (error) {
        console.error('Error fetching project:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// PATCH /api/projects/[id] - Update a project
async function PATCH(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const updates = await request.json();
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(id);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const updateResult = await projectRepository.update(id, updates);
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ project: updateResult.data });
    }
    catch (error) {
        console.error('Error updating project:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// DELETE /api/projects/[id] - Delete a project
async function DELETE(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(id);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const deleteResult = await projectRepository.delete(id);
        if ((0, result_1.isFailure)(deleteResult)) {
            return server_1.NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting project:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
