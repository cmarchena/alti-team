import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

interface StatusCount {
  status: string
  _count: { id: number }
}

interface Organization {
  id: string
  name: string
}

// GET /api/dashboard - Get dashboard metrics for the user's organizations
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all organizations the user has access to
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            teamMembers: {
              some: { userId },
            },
          },
        ],
      },
      select: { id: true, name: true },
    })

    const organizationIds = organizations.map((org: Organization) => org.id)

    if (organizationIds.length === 0) {
      return NextResponse.json({
        metrics: {
          totalProjects: 0,
          totalTasks: 0,
          teamMembers: 0,
          pendingInvitations: 0,
          projectsByStatus: {},
          tasksByStatus: {},
          recentProjects: [],
          recentTasks: [],
        },
        organizations: [],
      })
    }

    // Get project counts by status
    let projectsByStatusRaw: StatusCount[] = []
    try {
      const groupByResult = await prisma.project.groupBy({
        by: ["status"],
        where: {
          organizationId: { in: organizationIds },
        },
        _count: { id: true },
      })
      projectsByStatusRaw = groupByResult as StatusCount[]
    } catch (groupError) {
      console.error("groupBy error:", groupError)
      // Fallback: manual aggregation
      const allProjects = await prisma.project.findMany({
        where: { organizationId: { in: organizationIds } },
        select: { status: true },
      })
      const statusCounts: Record<string, number> = {}
      allProjects.forEach((p: { status: string }) => {
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
      where: { organizationId: { in: organizationIds } },
    })

    // Get task counts by status
    let tasksByStatusRaw: StatusCount[] = []
    try {
      const taskGroupByResult = await prisma.task.groupBy({
        by: ["status"],
        where: {
          project: {
            organizationId: { in: organizationIds },
          },
        },
        _count: { id: true },
      })
      tasksByStatusRaw = taskGroupByResult as StatusCount[]
    } catch (taskGroupError) {
      console.error("tasks groupBy error:", taskGroupError)
      // Fallback: manual aggregation
      const allTasks = await prisma.task.findMany({
        where: {
          project: { organizationId: { in: organizationIds } },
        },
        select: { status: true },
      })
      const statusCounts: Record<string, number> = {}
      allTasks.forEach((t: { status: string }) => {
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
          organizationId: { in: organizationIds },
        },
      },
    })

    // Get team members count
    const teamMembers = await prisma.teamMember.count({
      where: {
        organizationId: { in: organizationIds },
      },
    })

    // Get pending invitations count
    const pendingInvitations = await prisma.invitation.count({
      where: {
        organizationId: { in: organizationIds },
        status: "PENDING",
      },
    })

    // Get recent projects
    const recentProjects = await prisma.project.findMany({
      where: { organizationId: { in: organizationIds } },
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
          organizationId: { in: organizationIds },
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

    return NextResponse.json({
      metrics: {
        totalProjects,
        totalTasks,
        teamMembers,
        pendingInvitations,
        projectsByStatus,
        tasksByStatus,
      },
      recentProjects,
      recentTasks,
      organizations,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
