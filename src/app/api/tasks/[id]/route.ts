import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getTaskRepository, getProjectRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(id)

    if (isFailure(taskResult) || !taskResult.data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Verify user has access to the project
    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(taskResult.data.projectId)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ task: taskResult.data })
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()

    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(id)

    if (isFailure(taskResult) || !taskResult.data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Verify user has access to the project
    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(taskResult.data.projectId)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const updateResult = await taskRepository.update(id, updates)

    if (isFailure(updateResult)) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ task: updateResult.data })
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(id)

    if (isFailure(taskResult) || !taskResult.data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Verify user has access to the project
    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(taskResult.data.projectId)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const deleteResult = await taskRepository.delete(id)

    if (isFailure(deleteResult)) {
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
