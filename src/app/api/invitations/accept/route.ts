import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getInvitationRepository, getOrganizationRepository, getTeamMemberRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// POST /api/invitations/accept - Accept an invitation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token, organizationId } = await request.json()

    if (!token || !organizationId) {
      return NextResponse.json({ error: "token and organizationId are required" }, { status: 400 })
    }

    const invitationRepository = getInvitationRepository()
    const invitationResult = await invitationRepository.findByToken(token)

    if (isFailure(invitationResult) || !invitationResult.data) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    const invitation = invitationResult.data

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation has already been processed" }, { status: 400 })
    }

    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "This invitation was sent to a different email address" }, { status: 403 })
    }

    if (invitation.organizationId !== organizationId) {
      return NextResponse.json({ error: "Organization mismatch" }, { status: 400 })
    }

    // Accept the invitation
    const updateResult = await invitationRepository.update(invitation.id, {
      status: "ACCEPTED",
    })

    if (isFailure(updateResult)) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    // Add user to organization as member (create TeamMember)
    const teamMemberRepository = getTeamMemberRepository()
    const memberResult = await teamMemberRepository.create({
      userId: session.user.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
      departmentId: invitation.departmentId || undefined,
    })

    if (isFailure(memberResult)) {
      return NextResponse.json({ error: "Failed to add member to organization" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Successfully joined the organization",
      organizationId: invitation.organizationId 
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
