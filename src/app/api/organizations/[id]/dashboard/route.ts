import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getProjectRepository,
  getTaskRepository,
  getOrganizationRepository,
  getTeamMemberRepository,
  getDepartmentRepository,
} from '@/lib/repositories'
import { isSuccess, isFailure } from '@/lib/result'

// GET /api/organizations/[id]/dashboard - Get organization dashboard data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params

    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)

    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      )
    }

    const teamMemberRepository = getTeamMemberRepository()
    const memberResult = await teamMemberRepository.findByUserId(
      session.user.id,
    )
    const isMember =
      isSuccess(memberResult) &&
      memberResult.data.some((m) => m.organizationId === organizationId)

    if (orgResult.data.ownerId !== session.user.id && !isMember) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 },
      )
    }

    const organization = orgResult.data

    // Get all projects for the organization
    const projectRepository = getProjectRepository()
    const projectsResult =
      await projectRepository.findByOrganizationId(organizationId)
    const projects = isSuccess(projectsResult) ? projectsResult.data : []
    const projectIds = projects.map((p) => p.id)

    // Get all team members
    const membersResult =
      await teamMemberRepository.findByOrganizationId(organizationId)
    const members = isSuccess(membersResult) ? membersResult.data : []

    // Get departments
    const departmentRepository = getDepartmentRepository()
    const deptResult =
      await departmentRepository.findByOrganizationId(organizationId)
    const departments = isSuccess(deptResult) ? deptResult.data : []

    // Calculate projects by status
    const projectsByStatus: Record<string, number> = {}
    for (const project of projects) {
      projectsByStatus[project.status] =
        (projectsByStatus[project.status] || 0) + 1
    }

    // Get all tasks for all projects
    const taskRepository = getTaskRepository()
    const allTasks: any[] = []

    for (const projectId of projectIds) {
      const tasksResult = await taskRepository.findByProjectId(projectId)
      if (isSuccess(tasksResult)) {
        allTasks.push(...tasksResult.data)
      }
    }

    // Calculate tasks by status
    const tasksByStatus: Record<string, number> = {}
    for (const task of allTasks) {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1
    }

    // Get recent tasks with project info
    const recentTasks = allTasks
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 10)
      .map((task) => {
        const project = projects.find((p) => p.id === task.projectId)
        return {
          ...task,
          project: project ? { id: project.id, name: project.name } : null,
        }
      })

    // Get recent projects with task counts
    const recentProjects = projects
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 5)
      .map((project) => {
        const projectTasks = allTasks.filter((t) => t.projectId === project.id)
        return {
          ...project,
          _count: {
            tasks: projectTasks.length,
            resources: 0,
          },
        }
      })

    return NextResponse.json({
      organization,
      metrics: {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        teamMembers: members.length,
        totalDepartments: departments.length,
        pendingInvitations: 0,
        projectsByStatus,
        tasksByStatus,
      },
      recentProjects,
      recentTasks,
      organizations: [{ id: organization.id, name: organization.name }],
    })
  } catch (error) {
    console.error('Error fetching organization dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
