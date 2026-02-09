import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getProjectRepository,
  getTaskRepository,
  getResourceRepository,
  getTeamMemberRepository,
} from '@/lib/repositories'
import { isSuccess, isFailure } from '@/lib/result'

// GET /api/projects/[id] - Get a single project with tasks, resources, and members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(id)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectResult.data

    // Get tasks
    const taskRepository = getTaskRepository()
    const tasksResult = await taskRepository.findByProjectId(id)
    const tasks = isSuccess(tasksResult) ? tasksResult.data || [] : []

    // Get resources
    const resourceRepository = getResourceRepository()
    const resourcesResult = await resourceRepository.findByProjectId(id)
    const resources = isSuccess(resourcesResult)
      ? resourcesResult.data || []
      : []

    // Get project members (team members from the same organization)
    const teamMemberRepository = getTeamMemberRepository()
    const membersResult = await teamMemberRepository.findByProjectId(id)
    const projectMembers = isSuccess(membersResult)
      ? membersResult.data || []
      : []

    // Transform to expected format for frontend
    const projectMembersFormatted = projectMembers.map((tm: any) => ({
      id: tm.id,
      role: tm.role,
      teamMember: {
        id: tm.id,
        role: tm.role,
        position: tm.position,
        user: {
          id: '',
          name: '',
          email: '',
        },
      },
    }))

    return NextResponse.json({
      project: {
        ...project,
        tasks,
        resources,
        projectMembers: projectMembersFormatted,
      },
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()

    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(id)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updateResult = await projectRepository.update(id, updates)

    if (isFailure(updateResult)) {
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ project: updateResult.data })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const projectRepository = getProjectRepository()
    const projectResult = await projectRepository.findById(id)

    if (isFailure(projectResult) || !projectResult.data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const deleteResult = await projectRepository.delete(id)

    if (isFailure(deleteResult)) {
      return NextResponse.json(
        { error: deleteResult.error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
