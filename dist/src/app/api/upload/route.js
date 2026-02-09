"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// POST /api/upload - Upload a resource (metadata only, file storage is external)
async function POST(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { name, url, type, projectId, metadata } = await request.json();
        if (!name || !url || !projectId) {
            return server_1.NextResponse.json({ error: "name, url, and projectId are required" }, { status: 400 });
        }
        // Verify project exists and user has access
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
        }
        const resourceRepository = (0, repositories_1.getResourceRepository)();
        const createResult = await resourceRepository.create({
            name,
            url,
            type: type || "FILE",
            projectId,
            uploadedById: session.user.id,
            metadata: metadata || undefined,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Resource uploaded successfully", resource: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error uploading resource:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
