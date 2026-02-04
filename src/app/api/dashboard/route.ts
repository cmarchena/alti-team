import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getProjectRepository, getTaskRepository, getNotificationRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/dashboard - Get dashboard data for the current user
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

    // Get user's organizations
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findByOwnerId(session.user.id)
    
    if (isFailure(orgResult)) {
      return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
    }

    const hasAccess = orgResult.data.some(org => org.id === organizationId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this organization" }, { status: 403 })
    }

    // Get projects for the organization
    const projectRepository = getProjectRepository()
    const projectsResult = await projectRepository.findByOrganizationId(organizationId)
    
    const projects = isSuccess(projectsResult) ? projectsResult.data : []
    const projectIds = projects.map((p) => p.id)

    // Get tasks for these projects
    const taskRepository = getTaskRepository()
    let recentTasks: Awaited<ReturnType<typeof taskRepository.findByProjectId>> extends { data: infer T } ? T : never[] = []
    
    if (projectIds.length > 0) {
      const tasksResult = await taskRepository.findByProjectId(projectIds[0])
      recentTasks = isSuccess(tasksResult) ? tasksResult.data.slice(0, 10) : []
    }

    // Get unread notifications
    const notificationRepository = getNotificationRepository()
    const notificationsResult = await notificationRepository.findByUserId(session.user.id)
    const unreadNotifications = isSuccess(notificationsResult) 
      ? notificationsResult.data.filter(n => !n.read).length 
      : 0

    return NextResponse.json({
      stats: {
        totalProjects: projects.length,
        totalTasks: recentTasks.length,
        pendingTasks: recentTasks.filter((t: { status: string }) => t.status === "TODO" || t.status === "IN_PROGRESS").length,
        unreadNotifications,
      },
      recentTasks,
      projects: projects.slice(0, 5),
    })
  } catch (error) {
    console.error("Error fetching dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
