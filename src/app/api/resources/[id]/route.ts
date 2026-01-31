import { NextResponse } from "next/server"
import { PrismaClient } from "../../../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

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

  // Owner has access
  if (project.organization.ownerId === userId) return true

  // Team member has access
  if (project.organization.teamMembers.length > 0) return true

  return false
}

// GET /api/resources/[id] - Get a single resource
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Check access to the project
    const hasAccess = await checkProjectAccess(resource.projectId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ resource })
  } catch (error) {
    console.error("Error fetching resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/resources/[id] - Update a resource
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, type, url } = await request.json()

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        name: name ?? undefined,
        type: type ?? undefined,
        url: url ?? undefined,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ message: "Resource updated successfully", resource })
  } catch (error) {
    console.error("Error updating resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/resources/[id] - Delete a resource
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.resource.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Resource deleted successfully" })
  } catch (error) {
    console.error("Error deleting resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
