import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getInvitationRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/invitations - List pending invitations for an organization
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 })
    }

    // Verify user has access to this organization
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)
    
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can view invitations" }, { status: 403 })
    }

    const invitationRepository = getInvitationRepository()
    const invitationsResult = await invitationRepository.findByOrganizationId(organizationId)

    if (isFailure(invitationsResult)) {
      return NextResponse.json({ error: invitationsResult.error.message }, { status: 500 })
    }

    // Filter to pending only
    const pendingInvitations = invitationsResult.data.filter(i => i.status === "PENDING")

    return NextResponse.json({ invitations: pendingInvitations })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/invitations - Create a new invitation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, role, organizationId, departmentId } = await request.json()

    if (!email || !organizationId) {
      return NextResponse.json({ error: "email and organizationId are required" }, { status: 400 })
    }

    // Verify user has access to this organization
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)
    
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can send invitations" }, { status: 403 })
    }

    const invitationRepository = getInvitationRepository()
    
    // Check if there's already a pending invitation
    const existingResult = await invitationRepository.findByOrganizationId(organizationId)
    if (isSuccess(existingResult)) {
      const existing = existingResult.data.find(i => i.email === email && i.status === "PENDING")
      if (existing) {
        return NextResponse.json({ error: "A pending invitation already exists for this email" }, { status: 409 })
      }
    }

    const createResult = await invitationRepository.create({
      email,
      role: role || "MEMBER",
      organizationId,
      departmentId: departmentId || undefined,
    })

    if (isFailure(createResult)) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Invitation sent successfully", invitation: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
