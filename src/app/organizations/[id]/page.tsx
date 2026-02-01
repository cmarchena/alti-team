"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import OrgChart from "@/components/OrgChart"

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
}

interface Department {
  id: string
  name: string
  description: string | null
  parentId: string | null
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string }[]
  _count?: {
    teamMembers: number
    processes: number
  }
}

interface DashboardMetrics {
  totalProjects: number
  totalTasks: number
  teamMembers: number
  totalDepartments: number
  pendingInvitations: number
  projectsByStatus: Record<string, number>
  tasksByStatus: Record<string, number>
}

interface RecentProject {
  id: string
  name: string
  status: string
  createdAt: string
  _count: { tasks: number; resources: number }
}

interface RecentTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  project: { id: string; name: string }
  assignedTo?: { user: { name: string | null } } | null
}

const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  ON_HOLD: "bg-orange-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
}

const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-purple-500",
  DONE: "bg-green-500",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-500",
  HIGH: "text-orange-500",
  URGENT: "text-red-500",
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params?.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"dashboard" | "departments">("dashboard")

  // Modal states
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)

  // Form states
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (organizationId) {
      fetchData()
    }
  }, [organizationId])

  const fetchData = async () => {
    try {
      const [dashboardRes, deptRes] = await Promise.all([
        fetch(`/api/organizations/${organizationId}/dashboard`),
        fetch(`/api/departments?organizationId=${organizationId}`),
      ])

      if (!dashboardRes.ok) {
        if (dashboardRes.status === 401 || dashboardRes.status === 403) {
          router.push("/auth/signin")
          return
        }
        throw new Error("Failed to load organization")
      }

      const dashboardData = await dashboardRes.json()
      setOrganization(dashboardData.organization)
      setMetrics(dashboardData.metrics)
      setRecentProjects(dashboardData.recentProjects || [])
      setRecentTasks(dashboardData.recentTasks || [])

      if (deptRes.ok) {
        const deptData = await deptRes.json()
        setDepartments(deptData.departments || [])
      }
    } catch (err) {
      setError("An error occurred while loading data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deptFormData.name,
          description: deptFormData.description || null,
          organizationId,
          parentId: deptFormData.parentId || null,
        }),
      })

      if (res.ok) {
        setShowCreateDeptModal(false)
        setDeptFormData({ name: "", description: "", parentId: "" })
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to create department")
      }
    } catch (err) {
      setError("An error occurred while creating the department")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDepartment = async () => {
    if (!selectedDept) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/departments/${selectedDept.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setShowDeleteModal(false)
        setSelectedDept(null)
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete department")
      }
    } catch (err) {
      setError("An error occurred while deleting the department")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusPercentage = (statusCounts: Record<string, number>, status: string) => {
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0)
    if (total === 0) return 0
    return Math.round(((statusCounts[status] || 0) / total) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Organization not found</h2>
          <Link href="/organizations" className="mt-4 text-indigo-600 hover:text-indigo-500">
            Back to Organizations
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
              <Link href="/organizations" className="text-sm text-gray-500 hover:text-gray-700">
                ← Back to Organizations
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{organization.name}</h1>
              {organization.description && (
                <p className="mt-1 text-sm text-gray-500">{organization.description}</p>
              )}
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/organizations/${organizationId}/settings`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Settings
              </Link>
              <Link
                href={`/projects?organizationId=${organizationId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + New Project
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("departments")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "departments"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Departments & Org Chart
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {activeTab === "dashboard" && metrics && (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Projects</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {metrics.totalProjects}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Tasks</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {metrics.totalTasks}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {metrics.teamMembers}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Departments</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {metrics.totalDepartments}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Invites</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {metrics.pendingInvitations}
                  </dd>
                </div>
              </div>
            </div>

            {/* Status Breakdowns */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
              {/* Project Status */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Projects by Status</h3>
                {metrics.totalProjects === 0 ? (
                  <p className="text-gray-500 text-sm">No projects yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(PROJECT_STATUS_COLORS).map(([status, color]) => {
                      const count = metrics.projectsByStatus[status] || 0
                      const percentage = getStatusPercentage(metrics.projectsByStatus, status)
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{status.replace("_", " ")}</span>
                            <span className="text-gray-900 font-medium">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Task Status */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Status</h3>
                {metrics.totalTasks === 0 ? (
                  <p className="text-gray-500 text-sm">No tasks yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(TASK_STATUS_COLORS).map(([status, color]) => {
                      const count = metrics.tasksByStatus[status] || 0
                      const percentage = getStatusPercentage(metrics.tasksByStatus, status)
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{status.replace("_", " ")}</span>
                            <span className="text-gray-900 font-medium">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Projects */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
                  <Link
                    href={`/projects?organizationId=${organizationId}`}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentProjects.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <p className="text-gray-500 text-sm">No projects yet</p>
                      <Link
                        href={`/projects?organizationId=${organizationId}`}
                        className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Create your first project
                      </Link>
                    </div>
                  ) : (
                    recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{project.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {project._count.tasks} tasks · {project._count.resources} resources
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              project.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : project.status === "IN_PROGRESS"
                                ? "bg-yellow-100 text-yellow-800"
                                : project.status === "ON_HOLD"
                                ? "bg-orange-100 text-orange-800"
                                : project.status === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {project.status.replace("_", " ")}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Tasks */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Tasks</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentTasks.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <p className="text-gray-500 text-sm">No tasks yet</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Create a project first, then add tasks
                      </p>
                    </div>
                  ) : (
                    recentTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {task.project.name}
                              {task.assignedTo?.user?.name && (
                                <span> · {task.assignedTo.user.name}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                task.status === "DONE"
                                  ? "bg-green-100 text-green-800"
                                  : task.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : task.status === "IN_REVIEW"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "departments" && (
          <>
            {/* Departments Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Organization Chart</h3>
                <button
                  onClick={() => setShowCreateDeptModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  + Add Department
                </button>
              </div>
              <div className="p-6">
                {departments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No departments yet</p>
                    <button
                      onClick={() => setShowCreateDeptModal(true)}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Create your first department
                    </button>
                  </div>
                ) : (
                  <OrgChart
                    departments={departments}
                    onEdit={(dept) => {
                      setSelectedDept(dept)
                      setDeptFormData({
                        name: dept.name,
                        description: dept.description || "",
                        parentId: dept.parentId || "",
                      })
                      setShowCreateDeptModal(true)
                    }}
                    onAddSub={(parentId) => {
                      setDeptFormData({ name: "", description: "", parentId })
                      setShowCreateDeptModal(true)
                    }}
                    onDelete={(dept) => {
                      setSelectedDept(dept)
                      setShowDeleteModal(true)
                    }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Create Department Modal */}
      {showCreateDeptModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedDept ? "Edit Department" : "Create New Department"}
              </h3>
            </div>
            <form onSubmit={handleCreateDepartment}>
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="deptName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="deptName"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={deptFormData.name}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, name: e.target.value })
                    }
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label
                    htmlFor="deptDescription"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="deptDescription"
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={deptFormData.description}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, description: e.target.value })
                    }
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="parentDept"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Parent Department (optional)
                  </label>
                  <select
                    id="parentDept"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={deptFormData.parentId}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, parentId: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    {departments
                      .filter((d) => d.id !== selectedDept?.id)
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDeptModal(false)
                    setDeptFormData({ name: "", description: "", parentId: "" })
                    setSelectedDept(null)
                    setError("")
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : selectedDept ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDept && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete Department</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong>{selectedDept.name}</strong>?
                This action cannot be undone.
              </p>
              {selectedDept._count && (selectedDept._count.teamMembers > 0 || selectedDept._count.processes > 0) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    This department has {selectedDept._count.teamMembers} members and{" "}
                    {selectedDept._count.processes} processes. These will also be deleted.
                  </p>
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedDept(null)
                  setError("")
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDepartment}
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Delete Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
