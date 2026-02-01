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

// GET /api/tasks - List tasks by projectId
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

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignedTo: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, projectId, assignedToId, priority, dueDate } = await request.json()

    if (!title || !projectId) {
      return NextResponse.json({ error: "Title and projectId are required" }, { status: 400 })
    }

    const hasAccess = await checkProjectAccess(projectId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        projectId,
        assignedToId: assignedToId || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignedTo: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ message: "Task created successfully", task }, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
