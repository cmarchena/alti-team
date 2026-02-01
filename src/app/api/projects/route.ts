import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// Helper function to check if user has access to the organization
async function checkOrganizationAccess(organizationId: string, userId: string) {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      OR: [
        { ownerId: userId },
        {
          teamMembers: {
            some: { userId },
          },
        },
      ],
    },
  })
  return !!organization
}

// GET /api/projects - List projects by organizationId
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
    const hasAccess = await checkOrganizationAccess(organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { tasks: true, resources: true, projectMembers: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, organizationId, startDate, endDate } = await request.json()

    // Validate input
    if (!name || !organizationId) {
      return NextResponse.json({ error: "Name and organizationId are required" }, { status: 400 })
    }

    // Verify user has access to this organization
    const hasAccess = await checkOrganizationAccess(organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        organizationId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json({ message: "Project created successfully", project }, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
