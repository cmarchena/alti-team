import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// Helper function to check if adding parentId would create a cycle
async function wouldCreateCycle(departmentId: string, parentId: string | null): Promise<boolean> {
  if (!parentId) return false
  if (departmentId === parentId) return true

  let currentId: string | null = parentId
  while (currentId) {
    if (currentId === departmentId) return true
    const dept: { parentId: string | null } | null = await prisma.department.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    })
    currentId = dept?.parentId ?? null
  }
  return false
}

// GET /api/departments - List departments by organizationId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
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
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      )
    }

    const departments = await prisma.department.findMany({
      where: { organizationId },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        children: {
          select: { id: true, name: true },
        },
        _count: {
          select: { teamMembers: true, processes: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ departments })
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create a new department
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, description, organizationId, parentId } = await request.json()

    // Validate input
    if (!name || !organizationId) {
      return NextResponse.json(
        { error: "Name and organizationId are required" },
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
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      )
    }

    // If parentId is provided, verify it exists in the same organization
    if (parentId) {
      const parentDept = await prisma.department.findFirst({
        where: { id: parentId, organizationId },
      })

      if (!parentDept) {
        return NextResponse.json(
          { error: "Parent department not found in this organization" },
          { status: 400 }
        )
      }
    }

    const department = await prisma.department.create({
      data: {
        name,
        description: description || null,
        organizationId,
        parentId: parentId || null,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(
      { message: "Department created successfully", department },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating department:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
