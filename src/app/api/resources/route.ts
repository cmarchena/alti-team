import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// Helper function to check if user has access to the project
async function checkProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: {
        include: {
          teamMembers: {
            where: { userId },
          },
        },
      },
    },
  })

  if (!project) return false
  if (project.organization.ownerId === userId) return true
  if (project.organization.teamMembers.length > 0) return true
  return false
}

// GET /api/resources - List resources by projectId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const hasAccess = await checkProjectAccess(projectId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 })
    }

    const resources = await prisma.resource.findMany({
      where: { projectId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ resources })
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/resources - Create a new resource
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, url, projectId } = await request.json()

    if (!name || !projectId) {
      return NextResponse.json({ error: "Name and projectId are required" }, { status: 400 })
    }

    const hasAccess = await checkProjectAccess(projectId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 })
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        type: type || "OTHER",
        url: url || null,
        projectId,
        uploadedById: session.user.id,
      },
    })

    return NextResponse.json({ message: "Resource created successfully", resource }, { status: 201 })
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
