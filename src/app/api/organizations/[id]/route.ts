import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// Helper function to check if user is the owner of the organization
async function checkOrganizationOwnership(organizationId: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  })
  return organization?.ownerId === userId
}

// GET /api/organizations/[id] - Get a single organization
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        departments: true,
        teamMembers: true,
        projects: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check if user has access (owner only for now)
    if (organization.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/organizations/[id] - Update an organization
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check ownership
    const isOwner = await checkOrganizationOwnership(id, session.user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only the owner can update this organization" },
        { status: 403 }
      )
    }

    const { name, description } = await request.json()

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name,
        description: description ?? undefined,
      },
    })

    return NextResponse.json(
      { message: "Organization updated successfully", organization }
    )
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/organizations/[id] - Delete an organization
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check ownership
    const isOwner = await checkOrganizationOwnership(id, session.user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only the owner can delete this organization" },
        { status: 403 }
      )
    }

    await prisma.organization.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Organization deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
