import { NextResponse } from "next/server"
import { getOrganizationRepository } from "@/lib/repositories"
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

// GET /api/organizations - List all organizations for the current user
export async function GET(request: Request) {
  try {
    const userId = await validateToken(request.headers.get("authorization"))

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationRepository = getOrganizationRepository()
    const organizationsResult = await organizationRepository.findByOwnerId(userId)

    if (isFailure(organizationsResult)) {
      return NextResponse.json(
        { error: organizationsResult.error.message },
        { status: 500 }
      )
    }

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
    const userId = await validateToken(request.headers.get("authorization"))

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, description } = await request.json()

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
      ownerId: userId,
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
