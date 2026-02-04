import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTaskRepository, getProjectRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

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

    // Check project access
    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(projectId)
    
    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 })
    }

    // Check organization access
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(projectResult.data.organizationId)
    
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 403 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const taskRepository = getTaskRepository()
    const tasksResult = await taskRepository.findByProjectId(projectId)

    if (isFailure(tasksResult)) {
      return NextResponse.json({ error: tasksResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: tasksResult.data })
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

    // Check project access
    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(projectId)
    
    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 })
    }

    // Check organization access
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(projectResult.data.organizationId)
    
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 403 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const taskRepository = getTaskRepository()
    const createResult = await taskRepository.create({
      title,
      description: description || undefined,
      projectId,
      assignedToId: assignedToId || undefined,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
    })

    if (isFailure(createResult)) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Task created successfully", task: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
