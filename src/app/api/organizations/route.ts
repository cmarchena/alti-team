import { NextResponse } from "next/server"
import { PrismaClient } from "../../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

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

    const organizations = await prisma.organization.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        _count: {
          select: {
            departments: true,
            teamMembers: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ organizations })
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

    const organization = await prisma.organization.create({
      data: {
        name,
        description: description || null,
        ownerId: session.user.id,
      },
    })

    return NextResponse.json(
      { message: "Organization created successfully", organization },
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
