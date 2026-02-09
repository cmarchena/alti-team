"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/invitations - List pending invitations for an organization
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        if (!organizationId) {
            return server_1.NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }
        // Verify user has access to this organization
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can view invitations" }, { status: 403 });
        }
        const invitationRepository = (0, repositories_1.getInvitationRepository)();
        const invitationsResult = await invitationRepository.findByOrganizationId(organizationId);
        if ((0, result_1.isFailure)(invitationsResult)) {
            return server_1.NextResponse.json({ error: invitationsResult.error.message }, { status: 500 });
        }
        // Filter to pending only
        const pendingInvitations = invitationsResult.data.filter(i => i.status === "PENDING");
        return server_1.NextResponse.json({ invitations: pendingInvitations });
    }
    catch (error) {
        console.error("Error fetching invitations:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/invitations - Create a new invitation
async function POST(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { email, role, organizationId, departmentId } = await request.json();
        if (!email || !organizationId) {
            return server_1.NextResponse.json({ error: "email and organizationId are required" }, { status: 400 });
        }
        // Verify user has access to this organization
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can send invitations" }, { status: 403 });
        }
        const invitationRepository = (0, repositories_1.getInvitationRepository)();
        // Check if there's already a pending invitation
        const existingResult = await invitationRepository.findByOrganizationId(organizationId);
        if ((0, result_1.isSuccess)(existingResult)) {
            const existing = existingResult.data.find(i => i.email === email && i.status === "PENDING");
            if (existing) {
                return server_1.NextResponse.json({ error: "A pending invitation already exists for this email" }, { status: 409 });
            }
        }
        const createResult = await invitationRepository.create({
            email,
            role: role || "MEMBER",
            organizationId,
            departmentId: departmentId || undefined,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Invitation sent successfully", invitation: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating invitation:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
