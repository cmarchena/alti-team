import { NextResponse } from "next/server"
import { PrismaClient } from "../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// GET /api/teams - List all team members across user's organizations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organizations
    const userOrgs = await prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { teamMembers: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true },
    })

    const orgIds = userOrgs.map((org) => org.id)

    if (orgIds.length === 0) {
      return NextResponse.json({ teamMembers: [], organizations: [] })
    }

    // Get team members from all organizations
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        organizationId: { in: orgIds },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get organizations for the dropdown
    const organizations = await prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ teamMembers, organizations })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/teams - Update a team member's role
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { memberId, role, departmentId, position } = await request.json()

    // Verify user has access to the organization
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        organization: {
          include: {
            teamMembers: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Check if user is owner or admin
    const isOwner = member.organization.ownerId === session.user.id
    const isAdmin = member.organization.teamMembers.some(
      (m) => m.role === "ADMIN" && m.userId === session.user.id
    )

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        role: role ?? undefined,
        departmentId: departmentId ?? undefined,
        position: position ?? undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ message: "Team member updated", teamMember: updatedMember })
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/teams - Remove a team member
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 })
    }

    // Verify user has access to the organization
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        organization: {
          include: {
            teamMembers: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Check if user is owner or admin
    const isOwner = member.organization.ownerId === session.user.id
    const isAdmin = member.organization.teamMembers.some(
      (m) => m.role === "ADMIN" && m.userId === session.user.id
    )

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Cannot remove owner
    if (member.organization.ownerId === member.userId) {
      return NextResponse.json(
        { error: "Cannot remove the organization owner" },
        { status: 400 }
      )
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ message: "Team member removed" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
