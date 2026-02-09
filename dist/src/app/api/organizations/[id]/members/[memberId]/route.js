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
// GET /api/organizations/[id]/members/[memberId] - Get a single team member
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: organizationId, memberId } = await params;
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can view members" }, { status: 403 });
        }
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const memberResult = await teamMemberRepository.findById(memberId);
        if ((0, result_1.isFailure)(memberResult) || !memberResult.data) {
            return server_1.NextResponse.json({ error: "Member not found" }, { status: 404 });
        }
        if (memberResult.data.organizationId !== organizationId) {
            return server_1.NextResponse.json({ error: "Member not found in this organization" }, { status: 404 });
        }
        return server_1.NextResponse.json({ member: memberResult.data });
    }
    catch (error) {
        console.error("Error fetching team member:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// PATCH /api/organizations/[id]/members/[memberId] - Update a team member's role
async function PATCH(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: organizationId, memberId } = await params;
        const { role } = await request.json();
        if (!role) {
            return server_1.NextResponse.json({ error: "role is required" }, { status: 400 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can update members" }, { status: 403 });
        }
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const memberResult = await teamMemberRepository.findById(memberId);
        if ((0, result_1.isFailure)(memberResult) || !memberResult.data) {
            return server_1.NextResponse.json({ error: "Member not found" }, { status: 404 });
        }
        if (memberResult.data.organizationId !== organizationId) {
            return server_1.NextResponse.json({ error: "Member not found in this organization" }, { status: 404 });
        }
        const updateResult = await teamMemberRepository.update(memberId, { role });
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ member: updateResult.data });
    }
    catch (error) {
        console.error("Error updating team member:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// DELETE /api/organizations/[id]/members/[memberId] - Remove a team member
async function DELETE(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: organizationId, memberId } = await params;
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can remove members" }, { status: 403 });
        }
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const memberResult = await teamMemberRepository.findById(memberId);
        if ((0, result_1.isFailure)(memberResult) || !memberResult.data) {
            return server_1.NextResponse.json({ error: "Member not found" }, { status: 404 });
        }
        if (memberResult.data.organizationId !== organizationId) {
            return server_1.NextResponse.json({ error: "Member not found in this organization" }, { status: 404 });
        }
        const deleteResult = await teamMemberRepository.delete(memberId);
        if ((0, result_1.isFailure)(deleteResult)) {
            return server_1.NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Member removed successfully" });
    }
    catch (error) {
        console.error("Error removing team member:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
