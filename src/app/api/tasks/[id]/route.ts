import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// Helper function to check if user has access to the task's project
async function checkTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          organization: {
            include: {
              teamMembers: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  })

  if (!task) return false
  if (task.project.organization.ownerId === userId) return true
  if (task.project.organization.teamMembers.length > 0) return true
  return false
}

// GET /api/tasks/[id] - Get a single task
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

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignedTo: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Update a task
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

    const { title, description, status, priority, assignedToId, dueDate } = await request.json()

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title ?? undefined,
        description: description ?? undefined,
        status: status ?? undefined,
        priority: priority ?? undefined,
        assignedToId: assignedToId ?? undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
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

    return NextResponse.json({ message: "Task updated successfully", task })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete a task
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

    await prisma.task.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
