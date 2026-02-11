import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getOrganizationRepository,
  getTeamMemberRepository,
  getDepartmentRepository,
  getProjectRepository,
} from '@/lib/repositories'
import { isSuccess, isFailure } from '@/lib/result'

// GET /api/organizations - List all organizations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const organizationRepository = getOrganizationRepository()
    const teamMemberRepository = getTeamMemberRepository()

    // Find organizations where user is owner
    const ownedOrgsResult = await organizationRepository.findByOwnerId(userId)

    // Find organizations where user is a member
    const memberOrgsResult = await teamMemberRepository.findByUserId(userId)

    const organizations: any[] = []

    if (isSuccess(ownedOrgsResult)) {
      for (const org of ownedOrgsResult.data) {
        organizations.push({
          ...org,
          role: 'owner',
        })
      }
    }

    if (isSuccess(memberOrgsResult)) {
      const ownedOrgIds = new Set(
        isSuccess(ownedOrgsResult)
          ? ownedOrgsResult.data.map((org) => org.id)
          : [],
      )
      for (const membership of memberOrgsResult.data) {
        if (ownedOrgIds.has(membership.organizationId)) continue
        const orgResult = await organizationRepository.findById(
          membership.organizationId,
        )
        if (isSuccess(orgResult) && orgResult.data) {
          organizations.push({
            ...orgResult.data,
            role: membership.role,
          })
        }
      }
    }

    const departmentRepository = getDepartmentRepository()
    const projectRepository = getProjectRepository()

    const organizationsWithCounts = []
    for (const org of organizations) {
      const [deptResult, memberResult, projectResult] = await Promise.all([
        departmentRepository.findByOrganizationId(org.id),
        teamMemberRepository.findByOrganizationId(org.id),
        projectRepository.findByOrganizationId(org.id),
      ])

      organizationsWithCounts.push({
        ...org,
        _count: {
          departments: isSuccess(deptResult) ? deptResult.data.length : 0,
          teamMembers: isSuccess(memberResult) ? memberResult.data.length : 0,
          projects: isSuccess(projectResult) ? projectResult.data.length : 0,
        },
      })
    }

    return NextResponse.json({ organizations: organizationsWithCounts })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// POST /api/organizations - Create a new organization
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 },
      )
    }

    const organizationRepository = getOrganizationRepository()
    const teamMemberRepository = getTeamMemberRepository()

    // Create the organization
    const createResult = await organizationRepository.create({
      name,
      description: description || undefined,
      ownerId: userId,
    })

    if (isFailure(createResult)) {
      return NextResponse.json(
        { error: createResult.error.message },
        { status: 500 },
      )
    }

    const organization = createResult.data

    // Create team member entry for the owner
    const memberResult = await teamMemberRepository.create({
      userId,
      organizationId: organization.id,
      role: 'ADMIN',
      position: 'Owner',
    })

    if (isFailure(memberResult)) {
      return NextResponse.json(
        {
          error: `Organization created but failed to add owner as member: ${memberResult.error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: 'Organization created successfully', organization },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
