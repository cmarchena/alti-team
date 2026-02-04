import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getTeamMemberRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/organizations/[id]/members/[memberId] - Get a single team member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: organizationId, memberId } = await params

    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)

    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can view members" }, { status: 403 })
    }

    const teamMemberRepository = getTeamMemberRepository()
    const memberResult = await teamMemberRepository.findById(memberId)

    if (isFailure(memberResult) || !memberResult.data) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (memberResult.data.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found in this organization" }, { status: 404 })
    }

    return NextResponse.json({ member: memberResult.data })
  } catch (error) {
    console.error("Error fetching team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/organizations/[id]/members/[memberId] - Update a team member's role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: organizationId, memberId } = await params
    const { role } = await request.json()

    if (!role) {
      return NextResponse.json({ error: "role is required" }, { status: 400 })
    }

    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)

    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can update members" }, { status: 403 })
    }

    const teamMemberRepository = getTeamMemberRepository()
    const memberResult = await teamMemberRepository.findById(memberId)

    if (isFailure(memberResult) || !memberResult.data) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (memberResult.data.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found in this organization" }, { status: 404 })
    }

    const updateResult = await teamMemberRepository.update(memberId, { role })

    if (isFailure(updateResult)) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ member: updateResult.data })
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/organizations/[id]/members/[memberId] - Remove a team member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: organizationId, memberId } = await params

    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)

    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can remove members" }, { status: 403 })
    }

    const teamMemberRepository = getTeamMemberRepository()
    const memberResult = await teamMemberRepository.findById(memberId)

    if (isFailure(memberResult) || !memberResult.data) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (memberResult.data.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found in this organization" }, { status: 404 })
    }

    const deleteResult = await teamMemberRepository.delete(memberId)

    if (isFailure(deleteResult)) {
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
