"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// POST /api/invitations/accept - Accept an invitation
async function POST(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id || !session?.user?.email) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { token, organizationId } = await request.json();
        if (!token || !organizationId) {
            return server_1.NextResponse.json({ error: "token and organizationId are required" }, { status: 400 });
        }
        const invitationRepository = (0, repositories_1.getInvitationRepository)();
        const invitationResult = await invitationRepository.findByToken(token);
        if ((0, result_1.isFailure)(invitationResult) || !invitationResult.data) {
            return server_1.NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
        }
        const invitation = invitationResult.data;
        if (invitation.status !== "PENDING") {
            return server_1.NextResponse.json({ error: "Invitation has already been processed" }, { status: 400 });
        }
        if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
            return server_1.NextResponse.json({ error: "This invitation was sent to a different email address" }, { status: 403 });
        }
        if (invitation.organizationId !== organizationId) {
            return server_1.NextResponse.json({ error: "Organization mismatch" }, { status: 400 });
        }
        // Accept the invitation
        const updateResult = await invitationRepository.update(invitation.id, {
            status: "ACCEPTED",
        });
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        // Add user to organization as member (create TeamMember)
        const teamMemberRepository = (0, repositories_1.getTeamMemberRepository)();
        const memberResult = await teamMemberRepository.create({
            userId: session.user.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
            departmentId: invitation.departmentId || undefined,
        });
        if ((0, result_1.isFailure)(memberResult)) {
            return server_1.NextResponse.json({ error: "Failed to add member to organization" }, { status: 500 });
        }
        return server_1.NextResponse.json({
            message: "Successfully joined the organization",
            organizationId: invitation.organizationId
        });
    }
    catch (error) {
        console.error("Error accepting invitation:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
