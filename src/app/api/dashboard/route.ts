import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getProjectRepository,
  getTaskRepository,
  getNotificationRepository,
  getOrganizationRepository,
  getTeamMemberRepository,
} from '@/lib/repositories'
import { isSuccess, isFailure } from '@/lib/result'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationRepository = getOrganizationRepository()
    const projectRepository = getProjectRepository()
    const taskRepository = getTaskRepository()
    const teamMemberRepository = getTeamMemberRepository()
    const notificationRepository = getNotificationRepository()

    // Get user's team memberships
    const teamMemberResult = await teamMemberRepository.findByUserId(
      session.user.id,
    )
    const teamMembers = isSuccess(teamMemberResult)
      ? teamMemberResult.data || []
      : []

    // Get organizations where user is member or owner
    const orgIds = new Set<string>()

    for (const tm of teamMembers) {
      const orgId = (tm as any).organizationId || (tm as any).organization_id
      if (orgId) {
        orgIds.add(orgId)
      }
    }

    const ownerOrgsResult = await organizationRepository.findByOwnerId(
      session.user.id,
    )
    if (isSuccess(ownerOrgsResult)) {
      for (const org of ownerOrgsResult.data || []) {
        orgIds.add(org.id)
      }
    }

    const organizations: { id: string; name: string }[] = []
    const allProjects: any[] = []
    const allTasks: any[] = []

    const projectsByStatus: Record<string, number> = {}
    const tasksByStatus: Record<string, number> = {}

    for (const orgId of Array.from(orgIds)) {
      const orgResult = await organizationRepository.findById(orgId)
      if (isSuccess(orgResult) && orgResult.data) {
        organizations.push({ id: orgResult.data.id, name: orgResult.data.name })
      }

      const projectsResult = await projectRepository.findByOrganizationId(orgId)
      if (isSuccess(projectsResult)) {
        for (const project of projectsResult.data || []) {
          allProjects.push({
            id: project.id,
            name: project.name,
            status: project.status,
            _count: { tasks: 0, resources: 0 },
          })
          projectsByStatus[project.status] =
            (projectsByStatus[project.status] || 0) + 1

          const tasksResult = await taskRepository.findByProjectId(project.id)
          if (isSuccess(tasksResult)) {
            for (const task of tasksResult.data || []) {
              allTasks.push({
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                project: { id: project.id, name: project.name },
                assignedTo: null,
              })
              tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1
            }
          }
        }
      }
    }

    const notificationsResult = await notificationRepository.findByUserId(
      session.user.id,
    )
    const unreadNotifications = isSuccess(notificationsResult)
      ? (notificationsResult.data || []).filter((n: any) => !n.read).length
      : 0

    const recentProjects = allProjects
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 5)

    return NextResponse.json({
      metrics: {
        totalProjects: allProjects.length,
        totalTasks: allTasks.length,
        teamMembers: teamMembers.length,
        pendingInvitations: unreadNotifications,
        projectsByStatus,
        tasksByStatus,
      },
      recentProjects,
      recentTasks: allTasks.slice(0, 10),
      organizations,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
