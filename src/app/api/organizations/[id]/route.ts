import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

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

    const organizationRepository = getOrganizationRepository()
    const organizationResult = await organizationRepository.findById(id)

    if (isFailure(organizationResult)) {
      return NextResponse.json(
        { error: organizationResult.error.message },
        { status: 500 }
      )
    }

    if (!organizationResult.data) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization: organizationResult.data })
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
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(id)
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can update this organization" },
        { status: 403 }
      )
    }

    const { name, description } = await request.json()

    const updateResult = await organizationRepository.update(id, {
      name,
      description: description ?? undefined,
    })

    if (isFailure(updateResult)) {
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Organization updated successfully", organization: updateResult.data }
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
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(id)
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can delete this organization" },
        { status: 403 }
      )
    }

    const deleteResult = await organizationRepository.delete(id)

    if (isFailure(deleteResult)) {
      return NextResponse.json(
        { error: deleteResult.error.message },
        { status: 500 }
      )
    }

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
