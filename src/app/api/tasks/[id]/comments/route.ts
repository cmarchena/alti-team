import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getTaskRepository, getCommentRepository, getProjectRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/tasks/[id]/comments - Get comments for a task
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: taskId } = await params

    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(taskId)

    if (isFailure(taskResult) || !taskResult.data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(taskResult.data.projectId)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // TODO: Verify user has access to the project

    const commentRepository = getCommentRepository()
    const commentsResult = await commentRepository.findByTaskId(taskId)

    if (isFailure(commentsResult)) {
      return NextResponse.json({ error: commentsResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: commentsResult.data })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks/[id]/comments - Add a comment to a task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: taskId } = await params
    const { content, parentId } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const taskRepository = getTaskRepository()
    const taskResult = await taskRepository.findById(taskId)

    if (isFailure(taskResult) || !taskResult.data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const commentRepository = getCommentRepository()
    const createResult = await commentRepository.create({
      content,
      taskId,
      userId: session.user.id,
      parentId: parentId || undefined,
    })

    if (isFailure(createResult)) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Comment added successfully", comment: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
