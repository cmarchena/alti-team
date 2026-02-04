import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getResourceRepository, getProjectRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// POST /api/upload - Upload a resource (metadata only, file storage is external)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, url, type, projectId, metadata } = await request.json()

    if (!name || !url || !projectId) {
      return NextResponse.json({ error: "name, url, and projectId are required" }, { status: 400 })
    }

    // Verify project exists and user has access
    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(projectId)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    const resourceRepository = getResourceRepository()
    const createResult = await resourceRepository.create({
      name,
      url,
      type: type || "FILE",
      projectId,
      uploadedById: session.user.id,
      metadata: metadata || undefined,
    })

    if (isFailure(createResult)) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Resource uploaded successfully", resource: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error uploading resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
