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
// GET /api/organizations/[id] - Get a single organization
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        const { id } = await params;
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const organizationResult = await organizationRepository.findById(id);
        if ((0, result_1.isFailure)(organizationResult)) {
            return server_1.NextResponse.json({ error: organizationResult.error.message }, { status: 500 });
        }
        if (!organizationResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        return server_1.NextResponse.json({ organization: organizationResult.data });
    }
    catch (error) {
        console.error("Error fetching organization:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// PATCH /api/organizations/[id] - Update an organization
async function PATCH(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        const { id } = await params;
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Check ownership
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(id);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only the owner can update this organization" }, { status: 403 });
        }
        const { name, description } = await request.json();
        const updateResult = await organizationRepository.update(id, {
            name,
            description: description ?? undefined,
        });
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Organization updated successfully", organization: updateResult.data });
    }
    catch (error) {
        console.error("Error updating organization:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// DELETE /api/organizations/[id] - Delete an organization
async function DELETE(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        const { id } = await params;
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Check ownership
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(id);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only the owner can delete this organization" }, { status: 403 });
        }
        const deleteResult = await organizationRepository.delete(id);
        if ((0, result_1.isFailure)(deleteResult)) {
            return server_1.NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({
            message: "Organization deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting organization:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
