import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getResourceRepository, getProjectRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/resources/[id] - Get a single resource
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

    const resourceRepository = getResourceRepository()
    const resourceResult = await resourceRepository.findById(id)

    if (isFailure(resourceResult) || !resourceResult.data) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Verify user has access to the project
    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(resourceResult.data.projectId)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ resource: resourceResult.data })
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()

    const resourceRepository = getResourceRepository()
    const resourceResult = await resourceRepository.findById(id)

    if (isFailure(resourceResult) || !resourceResult.data) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    const updateResult = await resourceRepository.update(id, updates)

    if (isFailure(updateResult)) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ resource: updateResult.data })
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const resourceRepository = getResourceRepository()
    const resourceResult = await resourceRepository.findById(id)

    if (isFailure(resourceResult) || !resourceResult.data) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    const deleteResult = await resourceRepository.delete(id)

    if (isFailure(deleteResult)) {
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Resource deleted successfully" })
  } catch (error) {
    console.error("Error deleting resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
