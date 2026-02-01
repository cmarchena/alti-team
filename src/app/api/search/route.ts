import { NextResponse } from "next/server"
import { PrismaClient } from "../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// GET /api/search?q=query - Search across projects, tasks, and resources
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type") || "all" // projects, tasks, resources, all

    if (!query.trim()) {
      return NextResponse.json({
        projects: [],
        tasks: [],
        resources: [],
      })
    }

    const searchTerm = query

    // Get user's organizations
    const userOrgs = await prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { teamMembers: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true },
    })

    const orgIds = userOrgs.map((org) => org.id)

    if (orgIds.length === 0) {
      return NextResponse.json({
        projects: [],
        tasks: [],
        resources: [],
      })
    }

    const results: {
      projects: Array<{
        id: string
        name: string
        description: string | null
        status: string
        organizationId: string
      }>
      tasks: Array<{
        id: string
        title: string
        description: string | null
        status: string
        priority: string
        projectId: string
        project: { id: string; name: string }
      }>
      resources: Array<{
        id: string
        name: string
        type: string
        url: string | null
        projectId: string
        project: { id: string; name: string }
      }>
    } = {
      projects: [],
      tasks: [],
      resources: [],
    }

    // Search Projects
    if (type === "all" || type === "projects") {
      results.projects = await prisma.project.findMany({
        where: {
          organizationId: { in: orgIds },
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          organizationId: true,
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      })
    }

    // Search Tasks
    if (type === "all" || type === "tasks") {
      results.tasks = await prisma.task.findMany({
        where: {
          project: { organizationId: { in: orgIds } },
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          projectId: true,
          project: { select: { id: true, name: true } },
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      })
    }

    // Search Resources
    if (type === "all" || type === "resources") {
      results.resources = await prisma.resource.findMany({
        where: {
          project: { organizationId: { in: orgIds } },
          OR: [
            { name: { contains: searchTerm } },
            { url: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
          url: true,
          projectId: true,
          project: { select: { id: true, name: true } },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
