"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface Project {
  id: string
  name: string
  status: string
  startDate: string | null
  endDate: string | null
  tasks: Task[]
  projectMembers: ProjectMember[]
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  assignedTo: {
    id: string
    user: {
      id: string
      name: string | null
      email: string
    }
  } | null
}

interface ProjectMember {
  id: string
  teamMember: {
    id: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }
}

interface TaskStats {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  overdue: number
  completedOnTime: number
  completedLate: number
}

interface MemberStats {
  memberId: string
  name: string
  email: string
  assigned: number
  completed: number
  inProgress: number
}

const statusColors: Record<string, string> = {
  TODO: "bg-gray-200",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-yellow-500",
  DONE: "bg-green-500",
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-300",
  MEDIUM: "bg-blue-400",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
}

export default function ProjectAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [memberStats, setMemberStats] = useState<MemberStats[]>([])

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data.project)
        calculateStats(data.project)
      } else if (res.status === 401) {
        router.push("/auth/signin")
      } else if (res.status === 403 || res.status === 404) {
        router.push("/projects")
      } else {
        setError("Failed to load project")
      }
    } catch (err) {
      setError("An error occurred while loading project")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (project: Project) => {
    const tasks = project.tasks
    const now = new Date()

    // Task stats
    const stats: TaskStats = {
      total: tasks.length,
      byStatus: {
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
      },
      byPriority: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        URGENT: 0,
      },
      overdue: 0,
      completedOnTime: 0,
      completedLate: 0,
    }

    tasks.forEach((task) => {
      // Count by status
      if (stats.byStatus[task.status] !== undefined) {
        stats.byStatus[task.status]++
      }

      // Count by priority
      if (stats.byPriority[task.priority] !== undefined) {
        stats.byPriority[task.priority]++
      }

      // Check overdue
      if (task.dueDate && task.status !== "DONE") {
        if (new Date(task.dueDate) < now) {
          stats.overdue++
        }
      }

      // Check completion timing (simplified - would need actual completion date in real app)
      if (task.status === "DONE" && task.dueDate) {
        // Assuming task was completed on time if it's done
        stats.completedOnTime++
      }
    })

    setTaskStats(stats)

    // Member stats
    const memberMap = new Map<string, MemberStats>()

    project.projectMembers.forEach((pm) => {
      memberMap.set(pm.teamMember.id, {
        memberId: pm.teamMember.id,
        name: pm.teamMember.user.name || "Unnamed",
        email: pm.teamMember.user.email,
        assigned: 0,
        completed: 0,
        inProgress: 0,
      })
    })

    tasks.forEach((task) => {
      if (task.assignedTo) {
        const member = memberMap.get(task.assignedTo.id)
        if (member) {
          member.assigned++
          if (task.status === "DONE") {
            member.completed++
          } else if (task.status === "IN_PROGRESS" || task.status === "IN_REVIEW") {
            member.inProgress++
          }
        }
      }
    })

    setMemberStats(Array.from(memberMap.values()))
  }

  const getCompletionPercentage = () => {
    if (!taskStats || taskStats.total === 0) return 0
    return Math.round((taskStats.byStatus.DONE / taskStats.total) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <Link href="/projects" className="mt-4 text-indigo-600 hover:text-indigo-500">
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/projects/${projectId}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to {project.name}
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Project Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">{project.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Tasks</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{taskStats?.total || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Completion Rate</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{getCompletionPercentage()}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Overdue Tasks</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{taskStats?.overdue || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Team Members</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{memberStats.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h3>
            <div className="space-y-4">
              {Object.entries(taskStats?.byStatus || {}).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status.replace("_", " ")}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${statusColors[status] || "bg-gray-400"}`}
                      style={{
                        width: `${taskStats?.total ? (count / taskStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Priority Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Priority Distribution</h3>
            <div className="space-y-4">
              {Object.entries(taskStats?.byPriority || {}).map(([priority, count]) => (
                <div key={priority}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{priority}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${priorityColors[priority] || "bg-gray-400"}`}
                      style={{
                        width: `${taskStats?.total ? (count / taskStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
            {memberStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No team members assigned to this project.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        In Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {memberStats.map((member) => (
                      <tr key={member.memberId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 text-sm font-medium">
                                {member.name[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.assigned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.inProgress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.completed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${member.assigned ? (member.completed / member.assigned) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {member.assigned ? Math.round((member.completed / member.assigned) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Project Timeline */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"}</span>
              <span>End: {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Not set"}</span>
            </div>
            {project.startDate && project.endDate && (
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-indigo-500 h-4 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          ((new Date().getTime() - new Date(project.startDate).getTime()) /
                            (new Date(project.endDate).getTime() - new Date(project.startDate).getTime())) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-center text-sm text-gray-600">
                  {new Date() < new Date(project.startDate)
                    ? "Project not started"
                    : new Date() > new Date(project.endDate)
                    ? "Project deadline passed"
                    : `${Math.round(
                        ((new Date().getTime() - new Date(project.startDate).getTime()) /
                          (new Date(project.endDate).getTime() - new Date(project.startDate).getTime())) *
                          100
                      )}% of timeline elapsed`}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
