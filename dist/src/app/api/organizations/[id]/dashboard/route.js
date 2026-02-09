"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/organizations/[id]/dashboard - Get organization dashboard data
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: organizationId } = await params;
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can view dashboard" }, { status: 403 });
        }
        // Get all projects for the organization
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectsResult = await projectRepository.findByOrganizationId(organizationId);
        const projects = (0, result_1.isSuccess)(projectsResult) ? projectsResult.data : [];
        const projectIds = projects.map((p) => p.id);
        // Get all team members
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const membersResult = await teamMemberRepository.findByOrganizationId(organizationId);
        const members = (0, result_1.isSuccess)(membersResult) ? membersResult.data : [];
        // Get task statistics (simplified)
        const taskRepository = (0, repositories_1.getTaskRepository)();
        let taskStats = { total: 0, completed: 0, pending: 0, inProgress: 0 };
        if (projectIds.length > 0) {
            const tasksResult = await taskRepository.findByProjectId(projectIds[0]);
            if ((0, result_1.isSuccess)(tasksResult)) {
                const tasks = tasksResult.data;
                taskStats = {
                    total: tasks.length,
                    completed: tasks.filter((t) => t.status === "DONE").length,
                    pending: tasks.filter((t) => t.status === "TODO").length,
                    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
                };
            }
        }
        return server_1.NextResponse.json({
            stats: {
                totalProjects: projects.length,
                totalMembers: members.length,
                ...taskStats,
            },
            projects: projects.slice(0, 10),
            recentMembers: members.slice(0, 5),
        });
    }
    catch (error) {
        console.error("Error fetching organization dashboard:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
