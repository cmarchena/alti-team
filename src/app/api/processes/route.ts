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

// GET /api/processes - List processes by departmentId or organizationId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("departmentId")
    const organizationId = searchParams.get("organizationId")

    if (!departmentId && !organizationId) {
      return NextResponse.json({ error: "departmentId or organizationId is required" }, { status: 400 })
    }

    let whereClause: any = {}

    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { organizationId: true },
      })

      if (!dept) {
        return NextResponse.json({ error: "Department not found" }, { status: 404 })
      }

      const hasAccess = await checkOrganizationAccess(dept.organizationId, session.user.id)
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      whereClause.departmentId = departmentId
    } else if (organizationId) {
      const hasAccess = await checkOrganizationAccess(organizationId, session.user.id)
      if (!hasAccess) {
        return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
      }

      whereClause.organizationId = organizationId
    }

    const processes = await prisma.process.findMany({
      where: whereClause,
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ processes })
  } catch (error) {
    console.error("Error fetching processes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/processes - Create a new process
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, departmentId, steps } = await request.json()

    if (!name || !departmentId) {
      return NextResponse.json({ error: "Name and departmentId are required" }, { status: 400 })
    }

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { organizationId: true },
    })

    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const hasAccess = await checkOrganizationAccess(dept.organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const process = await prisma.process.create({
      data: {
        name,
        description: description || null,
        departmentId,
        organizationId: dept.organizationId,
        steps: typeof steps === "string" ? steps : JSON.stringify(steps || []),
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ message: "Process created successfully", process }, { status: 201 })
  } catch (error) {
    console.error("Error creating process:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
