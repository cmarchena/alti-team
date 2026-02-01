import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"

interface StatusCount {
  status: string
  _count: { id: number }
}

interface ProjectStatus {
  status: string
}

interface TaskStatus {
  status: string
}

const prisma = new PrismaClient()

// GET /api/organizations/[id]/dashboard - Get dashboard metrics for a specific organization
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: organizationId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user has access to this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        OR: [
          { ownerId: userId },
          {
            teamMembers: {
              some: { userId },
            },
          },
        ],
      },
      select: { id: true, name: true, description: true, createdAt: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 }
      )
    }

    // Get project counts by status
    let projectsByStatusRaw
    try {
      projectsByStatusRaw = await prisma.project.groupBy({
        by: ["status"],
        where: {
          organizationId,
        },
        _count: { id: true },
      })
    } catch (groupError) {
      console.error("[DEBUG] groupBy error:", groupError)
      // Fallback: manual aggregation
      const allProjects = await prisma.project.findMany({
        where: { organizationId },
        select: { status: true },
      })
      const statusCounts: Record<string, number> = {}
      allProjects.forEach((p: ProjectStatus) => {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
      })
      projectsByStatusRaw = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        _count: { id: count },
      }))
    }

    const projectsByStatus = projectsByStatusRaw.reduce(
      (acc: Record<string, number>, item: StatusCount) => {
        acc[item.status] = item._count.id
        return acc
      },
      {} as Record<string, number>
    )

    // Get total projects
    const totalProjects = await prisma.project.count({
      where: { organizationId },
    })

    // Get task counts by status
    let tasksByStatusRaw
    try {
      tasksByStatusRaw = await prisma.task.groupBy({
        by: ["status"],
        where: {
          project: {
            organizationId,
          },
        },
        _count: { id: true },
      })
    } catch (taskGroupError) {
      console.error("[DEBUG] tasks groupBy error:", taskGroupError)
      // Fallback: manual aggregation
      const allTasks = await prisma.task.findMany({
        where: {
          project: { organizationId },
        },
        select: { status: true },
      })
      const statusCounts: Record<string, number> = {}
      allTasks.forEach((t: TaskStatus) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
      })
      tasksByStatusRaw = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        _count: { id: count },
      }))
    }

    const tasksByStatus = tasksByStatusRaw.reduce(
      (acc: Record<string, number>, item: StatusCount) => {
        acc[item.status] = item._count.id
        return acc
      },
      {} as Record<string, number>
    )

    // Get total tasks
    const totalTasks = await prisma.task.count({
      where: {
        project: {
          organizationId,
        },
      },
    })

    // Get team members count
    const teamMembers = await prisma.teamMember.count({
      where: {
        organizationId,
      },
    })

    // Get departments count
    const totalDepartments = await prisma.department.count({
      where: {
        organizationId,
      },
    })

    // Get pending invitations count
    const pendingInvitations = await prisma.invitation.count({
      where: {
        organizationId,
        status: "PENDING",
      },
    })

    // Get recent projects
    const recentProjects = await prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        _count: { select: { tasks: true, resources: true } },
      },
    })

    // Get recent tasks
    const recentTasks = await prisma.task.findMany({
      where: {
        project: {
          organizationId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignedTo: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    })

    // Get upcoming tasks (due soon)
    const upcomingTasks = await prisma.task.findMany({
      where: {
        project: {
          organizationId,
        },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        status: {
          not: "DONE",
        },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignedTo: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      organization,
      metrics: {
        totalProjects,
        totalTasks,
        teamMembers,
        totalDepartments,
        pendingInvitations,
        projectsByStatus,
        tasksByStatus,
      },
      recentProjects,
      recentTasks,
      upcomingTasks,
    })
  } catch (error) {
    console.error("Error fetching organization dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
