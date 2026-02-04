import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getProjectRepository, getTaskRepository, getOrganizationRepository, getTeamMemberRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/organizations/[id]/dashboard - Get organization dashboard data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: organizationId } = await params

    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)

    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can view dashboard" }, { status: 403 })
    }

    // Get all projects for the organization
    const projectRepository = getProjectRepository()
    const projectsResult = await projectRepository.findByOrganizationId(organizationId)
    const projects = isSuccess(projectsResult) ? projectsResult.data : []
    const projectIds = projects.map((p) => p.id)

    // Get all team members
    const teamMemberRepository = getTeamMemberRepository()
    const membersResult = await teamMemberRepository.findByOrganizationId(organizationId)
    const members = isSuccess(membersResult) ? membersResult.data : []

    // Get task statistics (simplified)
    const taskRepository = getTaskRepository()
    let taskStats = { total: 0, completed: 0, pending: 0, inProgress: 0 }
    
    if (projectIds.length > 0) {
      const tasksResult = await taskRepository.findByProjectId(projectIds[0])
      if (isSuccess(tasksResult)) {
        const tasks = tasksResult.data
        taskStats = {
          total: tasks.length,
          completed: tasks.filter((t) => t.status === "DONE").length,
          pending: tasks.filter((t) => t.status === "TODO").length,
          inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        }
      }
    }

    return NextResponse.json({
      stats: {
        totalProjects: projects.length,
        totalMembers: members.length,
        ...taskStats,
      },
      projects: projects.slice(0, 10),
      recentMembers: members.slice(0, 5),
    })
  } catch (error) {
    console.error("Error fetching organization dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
