"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/resources - List resources by projectId
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");
        if (!projectId) {
            return server_1.NextResponse.json({ error: "projectId is required" }, { status: 400 });
        }
        // Check project access
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
        }
        // Check organization access
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(projectResult.data.organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const resourceRepository = (0, repositories_1.getResourceRepository)();
        const resourcesResult = await resourceRepository.findByProjectId(projectId);
        if ((0, result_1.isFailure)(resourcesResult)) {
            return server_1.NextResponse.json({ error: resourcesResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ resources: resourcesResult.data });
    }
    catch (error) {
        console.error("Error fetching resources:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/resources - Create a new resource
async function POST(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { name, type, url, projectId } = await request.json();
        if (!name || !projectId) {
            return server_1.NextResponse.json({ error: "Name and projectId are required" }, { status: 400 });
        }
        // Check project access
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
        }
        // Check organization access
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(projectResult.data.organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const resourceRepository = (0, repositories_1.getResourceRepository)();
        const createResult = await resourceRepository.create({
            name,
            type: type || "OTHER",
            url: url || undefined,
            projectId,
            uploadedById: session.user.id,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Resource created successfully", resource: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating resource:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
