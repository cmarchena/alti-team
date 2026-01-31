import { NextResponse } from "next/server"
import { PrismaClient } from "../../../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// Helper function to check if user has access to the organization
async function checkOrganizationAccess(organizationId: string, userId: string) {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      ownerId: userId,
    },
  })
  return !!organization
}

// Helper function to check if setting parentId would create a cycle
async function wouldCreateCycle(departmentId: string, parentId: string | null): Promise<boolean> {
  if (!parentId) return false
  if (departmentId === parentId) return true

  let currentId: string | null = parentId
  while (currentId) {
    if (currentId === departmentId) return true
    const dept = await prisma.department.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    })
    currentId = dept?.parentId ?? null
  }
  return false
}

// GET /api/departments/[id] - Get a single department
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, ownerId: true },
        },
        parent: {
          select: { id: true, name: true },
        },
        children: {
          select: { id: true, name: true },
        },
        teamMembers: {
          select: { id: true, name: true, email: true, role: true, position: true },
        },
        processes: {
          select: { id: true, name: true },
        },
      },
    })

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      )
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(department.organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json({ department })
  } catch (error) {
    console.error("Error fetching department:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/departments/[id] - Update a department
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const department = await prisma.department.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      )
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(department.organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const { name, description, parentId } = await request.json()

    // Validate cycle if parentId is being changed
    if (parentId !== undefined) {
      if (parentId === id) {
        return NextResponse.json(
          { error: "A department cannot be its own parent" },
          { status: 400 }
        )
      }

      if (await wouldCreateCycle(id, parentId)) {
        return NextResponse.json(
          { error: "Cannot move department: would create a cycle in the hierarchy" },
          { status: 400 }
        )
      }

      // If parentId is provided, verify it exists in the same organization
      if (parentId) {
        const parentDept = await prisma.department.findFirst({
          where: { id: parentId, organizationId: department.organizationId },
        })

        if (!parentDept) {
          return NextResponse.json(
            { error: "Parent department not found in this organization" },
            { status: 400 }
          )
        }
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        parentId: parentId ?? undefined,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      message: "Department updated successfully",
      department: updatedDepartment,
    })
  } catch (error) {
    console.error("Error updating department:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[id] - Delete a department
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const department = await prisma.department.findUnique({
      where: { id },
      select: { organizationId: true, _count: { select: { children: true, teamMembers: true, processes: true } } },
    })

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      )
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(department.organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Check for children - Cascade delete is configured in schema, but warn if there are children
    if (department._count.children > 0) {
      return NextResponse.json(
        { error: `Cannot delete department: it has ${department._count.children} sub-departments. Move or delete them first.` },
        { status: 400 }
      )
    }

    // Check for team members
    if (department._count.teamMembers > 0) {
      return NextResponse.json(
        { error: `Cannot delete department: it has ${department._count.teamMembers} team members assigned. Remove them first.` },
        { status: 400 }
      )
    }

    // Check for processes
    if (department._count.processes > 0) {
      return NextResponse.json(
        { error: `Cannot delete department: it has ${department._count.processes} processes. Delete them first.` },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Department deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
