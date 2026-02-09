"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
async function GET() {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const notificationRepository = (0, repositories_1.getNotificationRepository)();
        // Get user's team memberships
        const teamMemberResult = await teamMemberRepository.findByUserId(session.user.id);
        const teamMembers = (0, result_1.isSuccess)(teamMemberResult)
            ? teamMemberResult.data || []
            : [];
        // Get organizations where user is member or owner
        const orgIds = new Set();
        for (const tm of teamMembers) {
            const orgId = tm.organizationId || tm.organization_id;
            if (orgId) {
                orgIds.add(orgId);
            }
        }
        const ownerOrgsResult = await organizationRepository.findByOwnerId(session.user.id);
        if ((0, result_1.isSuccess)(ownerOrgsResult)) {
            for (const org of ownerOrgsResult.data || []) {
                orgIds.add(org.id);
            }
        }
        const organizations = [];
        const allProjects = [];
        const allTasks = [];
        const projectsByStatus = {};
        const tasksByStatus = {};
        for (const orgId of Array.from(orgIds)) {
            const orgResult = await organizationRepository.findById(orgId);
            if ((0, result_1.isSuccess)(orgResult) && orgResult.data) {
                organizations.push({ id: orgResult.data.id, name: orgResult.data.name });
            }
            const projectsResult = await projectRepository.findByOrganizationId(orgId);
            if ((0, result_1.isSuccess)(projectsResult)) {
                for (const project of projectsResult.data || []) {
                    allProjects.push({
                        id: project.id,
                        name: project.name,
                        status: project.status,
                        createdAt: project.createdAt || project.created_at,
                        _count: { tasks: 0, resources: 0 },
                    });
                    projectsByStatus[project.status] =
                        (projectsByStatus[project.status] || 0) + 1;
                    const tasksResult = await taskRepository.findByProjectId(project.id);
                    if ((0, result_1.isSuccess)(tasksResult)) {
                        for (const task of tasksResult.data || []) {
                            allTasks.push({
                                id: task.id,
                                title: task.title,
                                status: task.status,
                                priority: task.priority,
                                dueDate: task.dueDate || task.due_date,
                                createdAt: task.createdAt || task.created_at,
                                project: { id: project.id, name: project.name },
                                assignedTo: null,
                            });
                            tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
                        }
                    }
                }
            }
        }
        const notificationsResult = await notificationRepository.findByUserId(session.user.id);
        const unreadNotifications = (0, result_1.isSuccess)(notificationsResult)
            ? (notificationsResult.data || []).filter((n) => !n.read).length
            : 0;
        const recentProjects = allProjects
            .sort((a, b) => new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime())
            .slice(0, 5);
        return server_1.NextResponse.json({
            metrics: {
                totalProjects: allProjects.length,
                totalTasks: allTasks.length,
                teamMembers: teamMembers.length,
                pendingInvitations: unreadNotifications,
                projectsByStatus,
                tasksByStatus,
            },
            recentProjects,
            recentTasks: allTasks.slice(0, 10),
            organizations,
        });
    }
    catch (error) {
        console.error('Dashboard error:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
