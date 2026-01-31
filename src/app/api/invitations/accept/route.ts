import { NextResponse } from "next/server"
import { PrismaClient } from "../../../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// POST /api/invitations/accept - Accept an invitation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
        department: true,
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 400 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation has already been used or expired" }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      })
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Verify the email matches
    if (session.user.email !== invitation.email) {
      return NextResponse.json(
        { error: "This invitation was sent to a different email address" },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 400 }
      )
    }

    // Create the team member
    const teamMember = await prisma.teamMember.create({
      data: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
        departmentId: invitation.departmentId,
        role: invitation.role,
      },
    })

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Successfully joined the organization",
      teamMember: {
        id: teamMember.id,
        role: teamMember.role,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
        },
      },
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
