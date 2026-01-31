import { NextResponse } from "next/server"
import { PrismaClient } from "../../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// GET /api/invitations - List pending invitations for organization
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 })
    }

    // Verify user has access to this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        ownerId: session.user.id,
      },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    const invitations = await prisma.invitation.findMany({
      where: { organizationId, status: "PENDING" },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/invitations - Create a new invitation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, role, organizationId, departmentId } = await request.json()

    // Validate input
    if (!email || !role || !organizationId) {
      return NextResponse.json(
        { error: "Email, role, and organizationId are required" },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        ownerId: session.user.id,
      },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        organizationId,
        user: { email },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase(),
        status: "PENDING",
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      )
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        role,
        organizationId,
        departmentId: departmentId || null,
        expiresAt,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
    })

    // TODO: Send email invitation using Resend or similar
    // For now, we'll return the invitation with the token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const invitationLink = `${baseUrl}/invitations/accept?token=${invitation.token}`

    return NextResponse.json(
      {
        message: "Invitation created successfully",
        invitation: {
          ...invitation,
          invitationLink,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
