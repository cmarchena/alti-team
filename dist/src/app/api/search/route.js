"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/search - Search across projects, tasks, resources
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const type = searchParams.get("type") || "all";
        if (!query) {
            return server_1.NextResponse.json({ error: "Search query is required" }, { status: 400 });
        }
        const results = {
            projects: [],
            tasks: [],
            resources: [],
        };
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const resourceRepository = (0, repositories_1.getResourceRepository)();
        // Get user's organizations
        const orgsResult = await organizationRepository.findByOwnerId(session.user.id);
        const orgs = (0, result_1.isSuccess)(orgsResult) ? orgsResult.data : [];
        const orgIds = orgs.map((org) => org.id);
        if (orgIds.length === 0) {
            return server_1.NextResponse.json({ results });
        }
        // Search projects (simplified - in real app would use full-text search)
        if (type === "all" || type === "projects") {
            const projectsResult = await projectRepository.findByOrganizationId(orgIds[0]);
            if ((0, result_1.isSuccess)(projectsResult)) {
                results.projects = projectsResult.data.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) ||
                    (p.description && p.description.toLowerCase().includes(query.toLowerCase())));
            }
        }
        // Search tasks
        if (type === "all" || type === "tasks") {
            const tasksResult = await taskRepository.findByProjectId(""); // Would need project filtering
            if ((0, result_1.isSuccess)(tasksResult)) {
                results.tasks = tasksResult.data.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()) ||
                    (t.description && t.description.toLowerCase().includes(query.toLowerCase())));
            }
        }
        // Search resources
        if (type === "all" || type === "resources") {
            const resourcesResult = await resourceRepository.findByProjectId(""); // Would need project filtering
            if ((0, result_1.isSuccess)(resourcesResult)) {
                results.resources = resourcesResult.data.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()) ||
                    (r.url && r.url.toLowerCase().includes(query.toLowerCase())));
            }
        }
        return server_1.NextResponse.json({ results });
    }
    catch (error) {
        console.error("Error searching:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
