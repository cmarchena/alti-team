import { NextResponse } from "next/server"
import { getProjectRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production"

async function validateToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string }
    return decoded.sub
  } catch {
    return null
  }
}

// GET /api/projects - List projects by organizationId
export async function GET(request: Request) {
  try {
    const userId = await validateToken(request.headers.get("authorization"))

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 })
    }

    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)
    
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    if (orgResult.data.ownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const projectRepository = getProjectRepository()
    const projectsResult = await projectRepository.findByOrganizationId(organizationId)

    if (isFailure(projectsResult)) {
      return NextResponse.json({ error: projectsResult.error.message }, { status: 500 })
    }

    const projectsWithCounts = projectsResult.data.map(project => ({
      ...project,
      _count: {
        tasks: 0,
        resources: 0,
        projectMembers: 0,
      },
    }))

    return NextResponse.json({ projects: projectsWithCounts })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const userId = await validateToken(request.headers.get("authorization"))

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, organizationId, startDate, endDate } = await request.json()

    if (!name || !organizationId) {
      return NextResponse.json({ error: "Name and organizationId are required" }, { status: 400 })
    }

    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)
    
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    if (orgResult.data.ownerId !== userId) {
      return NextResponse.json({ error: "Only organization owner can create projects" }, { status: 403 })
    }

    const projectRepository = getProjectRepository()
    const createResult = await projectRepository.create({
      name,
      description: description || undefined,
      organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    if (isFailure(createResult)) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Project created successfully", project: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
