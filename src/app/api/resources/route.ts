import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getResourceRepository, getProjectRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

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

    const resourceRepository = getResourceRepository()
    const resourcesResult = await resourceRepository.findByProjectId(projectId)

    if (isFailure(resourcesResult)) {
      return NextResponse.json({ error: resourcesResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ resources: resourcesResult.data })
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

    const resourceRepository = getResourceRepository()
    const createResult = await resourceRepository.create({
      name,
      type: type || "OTHER",
      url: url || undefined,
      projectId,
      uploadedById: session.user.id,
    })

    if (isFailure(createResult)) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Resource created successfully", resource: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
