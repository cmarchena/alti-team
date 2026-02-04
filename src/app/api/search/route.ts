import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getProjectRepository, getTaskRepository, getResourceRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/search - Search across projects, tasks, resources
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all"

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const results: Record<string, unknown[]> = {
      projects: [],
      tasks: [],
      resources: [],
    }

    const organizationRepository = getOrganizationRepository()
    const projectRepository = getProjectRepository()
    const taskRepository = getTaskRepository()
    const resourceRepository = getResourceRepository()

    // Get user's organizations
    const orgsResult = await organizationRepository.findByOwnerId(session.user.id)
    const orgs = isSuccess(orgsResult) ? orgsResult.data : []
    const orgIds = orgs.map((org) => org.id)

    if (orgIds.length === 0) {
      return NextResponse.json({ results })
    }

    // Search projects (simplified - in real app would use full-text search)
    if (type === "all" || type === "projects") {
      const projectsResult = await projectRepository.findByOrganizationId(orgIds[0])
      if (isSuccess(projectsResult)) {
        results.projects = projectsResult.data.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
        )
      }
    }

    // Search tasks
    if (type === "all" || type === "tasks") {
      const tasksResult = await taskRepository.findByProjectId("") // Would need project filtering
      if (isSuccess(tasksResult)) {
        results.tasks = tasksResult.data.filter((t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(query.toLowerCase()))
        )
      }
    }

    // Search resources
    if (type === "all" || type === "resources") {
      const resourcesResult = await resourceRepository.findByProjectId("") // Would need project filtering
      if (isSuccess(resourcesResult)) {
        results.resources = resourcesResult.data.filter((r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          (r.url && r.url.toLowerCase().includes(query.toLowerCase()))
        )
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
