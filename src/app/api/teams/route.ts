import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTeamMemberRepository, getOrganizationRepository, getUserRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/teams - List all team members across user's organizations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationRepository = getOrganizationRepository()
    const teamMemberRepository = getTeamMemberRepository()
    const userRepository = getUserRepository()

    // Get user's organizations where they are owner
    const orgsResult = await organizationRepository.findByOwnerId(session.user.id)
    const orgs = isSuccess(orgsResult) ? orgsResult.data : []
    const orgIds = orgs.map((org) => org.id)

    if (orgIds.length === 0) {
      return NextResponse.json({ teamMembers: [], organizations: [] })
    }

    // Get team members from all organizations
    const membersResult = await teamMemberRepository.findByOrganizationId(orgIds[0])
    const teamMembers = isSuccess(membersResult) ? membersResult.data : []

    // Enrich team members with user and org data
    const enrichedMembers = await Promise.all(teamMembers.map(async (m) => {
      const userResult = await userRepository.findById(m.userId)
      const orgResult = await organizationRepository.findById(m.organizationId)
      
      return {
        ...m,
        user: isSuccess(userResult) ? { 
          id: userResult.data.id, 
          name: userResult.data.name, 
          email: userResult.data.email 
        } : null,
        organization: isSuccess(orgResult) ? {
          id: orgResult.data.id,
          name: orgResult.data.name
        } : null,
      }
    }))

    // Get organizations for the dropdown
    const organizations = orgs.map((org) => ({
      id: org.id,
      name: org.name,
    }))

    return NextResponse.json({ teamMembers: enrichedMembers, organizations })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/teams - Update a team member's role
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { memberId, role, departmentId, position } = await request.json()

    const teamMemberRepository = getTeamMemberRepository()
    const organizationRepository = getOrganizationRepository()

    // Verify user has access to the organization
    const memberResult = await teamMemberRepository.findById(memberId)
    if (isFailure(memberResult) || !memberResult.data) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    const member = memberResult.data
    const orgResult = await organizationRepository.findById(member.organizationId)
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Only owner can update roles
    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can update team members" }, { status: 403 })
    }

    const updateResult = await teamMemberRepository.update(memberId, {
      role: role || undefined,
      departmentId: departmentId || undefined,
      position: position || undefined,
    })

    if (isFailure(updateResult)) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Team member updated successfully", member: updateResult.data })
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/teams - Remove a team member
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 })
    }

    const teamMemberRepository = getTeamMemberRepository()
    const organizationRepository = getOrganizationRepository()

    // Verify user has access to the organization
    const memberResult = await teamMemberRepository.findById(memberId)
    if (isFailure(memberResult) || !memberResult.data) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    const member = memberResult.data
    const orgResult = await organizationRepository.findById(member.organizationId)
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Only owner can remove members
    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can remove team members" }, { status: 403 })
    }

    const deleteResult = await teamMemberRepository.delete(memberId)

    if (isFailure(deleteResult)) {
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Team member removed successfully" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
