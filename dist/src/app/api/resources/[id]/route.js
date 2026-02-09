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
// GET /api/resources/[id] - Get a single resource
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const resourceRepository = (0, repositories_1.getResourceRepository)();
        const resourceResult = await resourceRepository.findById(id);
        if ((0, result_1.isFailure)(resourceResult) || !resourceResult.data) {
            return server_1.NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        // Verify user has access to the project
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(resourceResult.data.projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        return server_1.NextResponse.json({ resource: resourceResult.data });
    }
    catch (error) {
        console.error("Error fetching resource:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// PATCH /api/resources/[id] - Update a resource
async function PATCH(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const updates = await request.json();
        const resourceRepository = (0, repositories_1.getResourceRepository)();
        const resourceResult = await resourceRepository.findById(id);
        if ((0, result_1.isFailure)(resourceResult) || !resourceResult.data) {
            return server_1.NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        const updateResult = await resourceRepository.update(id, updates);
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ resource: updateResult.data });
    }
    catch (error) {
        console.error("Error updating resource:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// DELETE /api/resources/[id] - Delete a resource
async function DELETE(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const resourceRepository = (0, repositories_1.getResourceRepository)();
        const resourceResult = await resourceRepository.findById(id);
        if ((0, result_1.isFailure)(resourceResult) || !resourceResult.data) {
            return server_1.NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        const deleteResult = await resourceRepository.delete(id);
        if ((0, result_1.isFailure)(deleteResult)) {
            return server_1.NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Resource deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting resource:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
