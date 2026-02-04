import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/organizations - List all organizations for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const organizationRepository = getOrganizationRepository()
    const organizationsResult = await organizationRepository.findByOwnerId(session.user.id)

    if (isFailure(organizationsResult)) {
      return NextResponse.json(
        { error: organizationsResult.error.message },
        { status: 500 }
      )
    }

    // Add count fields for compatibility (in-memory doesn't support include)
    const organizationsWithCounts = organizationsResult.data.map(org => ({
      ...org,
      _count: {
        departments: 0,
        teamMembers: 0,
        projects: 0,
      },
    }))

    return NextResponse.json({ organizations: organizationsWithCounts })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/organizations - Create a new organization
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, description } = await request.json()

    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      )
    }

    const organizationRepository = getOrganizationRepository()
    const createResult = await organizationRepository.create({
      name,
      description: description || undefined,
      ownerId: session.user.id,
    })

    if (isFailure(createResult)) {
      return NextResponse.json(
        { error: createResult.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Organization created successfully", organization: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
