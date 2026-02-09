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
// GET /api/teams - List all team members across user's organizations
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const userRepository = (0, repositories_1.getUserRepository)();
        // Get user's organizations where they are owner
        const orgsResult = await organizationRepository.findByOwnerId(session.user.id);
        const orgs = (0, result_1.isSuccess)(orgsResult) ? orgsResult.data : [];
        const orgIds = orgs.map((org) => org.id);
        if (orgIds.length === 0) {
            return server_1.NextResponse.json({ teamMembers: [], organizations: [] });
        }
        // Get team members from all organizations
        const membersResult = await teamMemberRepository.findByOrganizationId(orgIds[0]);
        const teamMembers = (0, result_1.isSuccess)(membersResult) ? membersResult.data : [];
        // Enrich team members with user and org data
        const enrichedMembers = await Promise.all(teamMembers.map(async (m) => {
            const userResult = await userRepository.findById(m.userId);
            const orgResult = await organizationRepository.findById(m.organizationId);
            return {
                ...m,
                user: (0, result_1.isSuccess)(userResult) ? {
                    id: userResult.data.id,
                    name: userResult.data.name,
                    email: userResult.data.email
                } : null,
                organization: (0, result_1.isSuccess)(orgResult) ? {
                    id: orgResult.data.id,
                    name: orgResult.data.name
                } : null,
            };
        }));
        // Get organizations for the dropdown
        const organizations = orgs.map((org) => ({
            id: org.id,
            name: org.name,
        }));
        return server_1.NextResponse.json({ teamMembers: enrichedMembers, organizations });
    }
    catch (error) {
        console.error("Error fetching teams:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// PATCH /api/teams - Update a team member's role
async function PATCH(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { memberId, role, departmentId, position } = await request.json();
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        // Verify user has access to the organization
        const memberResult = await teamMemberRepository.findById(memberId);
        if ((0, result_1.isFailure)(memberResult) || !memberResult.data) {
            return server_1.NextResponse.json({ error: "Team member not found" }, { status: 404 });
        }
        const member = memberResult.data;
        const orgResult = await organizationRepository.findById(member.organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        // Only owner can update roles
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can update team members" }, { status: 403 });
        }
        const updateResult = await teamMemberRepository.update(memberId, {
            role: role || undefined,
            departmentId: departmentId || undefined,
            position: position || undefined,
        });
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Team member updated successfully", member: updateResult.data });
    }
    catch (error) {
        console.error("Error updating team member:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// DELETE /api/teams - Remove a team member
async function DELETE(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get("memberId");
        if (!memberId) {
            return server_1.NextResponse.json({ error: "memberId is required" }, { status: 400 });
        }
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        // Verify user has access to the organization
        const memberResult = await teamMemberRepository.findById(memberId);
        if ((0, result_1.isFailure)(memberResult) || !memberResult.data) {
            return server_1.NextResponse.json({ error: "Team member not found" }, { status: 404 });
        }
        const member = memberResult.data;
        const orgResult = await organizationRepository.findById(member.organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }
        // Only owner can remove members
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can remove team members" }, { status: 403 });
        }
        const deleteResult = await teamMemberRepository.delete(memberId);
        if ((0, result_1.isFailure)(deleteResult)) {
            return server_1.NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Team member removed successfully" });
    }
    catch (error) {
        console.error("Error removing team member:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
