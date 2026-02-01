import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// Helper function to check if user is admin/owner of the organization
async function checkAdminAccess(organizationId: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      teamMembers: {
        where: { userId },
      },
    },
  })

  if (!organization) return false

  // Owner has admin access
  if (organization.ownerId === userId) return true

  // Check if user is an admin team member
  const membership = organization.teamMembers[0]
  if (membership?.role === "ADMIN") return true

  return false
}

// GET /api/organizations/[id]/members/[memberId] - Get a specific member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: organizationId, memberId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to the organization
    const hasAccess = await checkAdminAccess(organizationId, session.user.id)
    if (!hasAccess) {
      // Check if user is at least a member
      const membership = await prisma.teamMember.findFirst({
        where: {
          organizationId,
          userId: session.user.id,
        },
      })
      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error("Error fetching member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/organizations/[id]/members/[memberId] - Update member role/position
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: organizationId, memberId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins/owners can update member roles
    const hasAccess = await checkAdminAccess(organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { role, position, departmentId } = await request.json()

    // Validate role
    const validRoles = ["ADMIN", "MANAGER", "MEMBER"]
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if member exists
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Prevent demoting the organization owner
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (organization?.ownerId === existingMember.userId && role && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot change the role of the organization owner" },
        { status: 400 }
      )
    }

    // Validate department if provided
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId,
        },
      })
      if (!department) {
        return NextResponse.json({ error: "Department not found" }, { status: 400 })
      }
    }

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        role: role ?? undefined,
        position: position ?? undefined,
        departmentId: departmentId === null ? null : departmentId ?? undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ message: "Member updated successfully", member })
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/organizations/[id]/members/[memberId] - Remove member from organization
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: organizationId, memberId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins/owners can remove members
    const hasAccess = await checkAdminAccess(organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if member exists
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Prevent removing the organization owner
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (organization?.ownerId === existingMember.userId) {
      return NextResponse.json(
        { error: "Cannot remove the organization owner" },
        { status: 400 }
      )
    }

    // Remove member from all project assignments first
    await prisma.projectMember.deleteMany({
      where: {
        teamMemberId: memberId,
      },
    })

    // Remove task assignments
    await prisma.task.updateMany({
      where: {
        assignedToId: memberId,
      },
      data: {
        assignedToId: null,
      },
    })

    // Delete the team member
    await prisma.teamMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
