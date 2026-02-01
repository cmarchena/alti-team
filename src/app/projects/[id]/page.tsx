"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
  createdAt: string
  tasks: Task[]
  resources: Resource[]
  projectMembers: ProjectMember[]
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  assignedTo?: {
    id: string
    role: string
    position: string | null
    user: {
      id: string
      name: string | null
      email: string
    }
  }
}

interface Resource {
  id: string
  name: string
  type: string
  url: string | null
  createdAt: string
}

interface ProjectMember {
  id: string
  role: string
  teamMember: {
    id: string
    role: string
    position: string | null
    user: {
      id: string
      name: string | null
      email: string
    }
  }
}

const statusColors: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const taskStatusColumns = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"tasks" | "resources" | "team">("tasks")

  // Task modal states
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
    assignedToId: "",
  })
  const [submitting, setSubmitting] = useState(false)

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
      } else if (res.status === 401 || res.status === 403) {
        router.push("/auth/signin")
      } else {
        setError("Failed to load project")
      }
    } catch (err) {
      setError("An error occurred while loading the project")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    // Validate due date
    if (taskFormData.dueDate && new Date(taskFormData.dueDate) < new Date(new Date().toDateString())) {
      setError("Due date cannot be in the past")
      setSubmitting(false)
      return
    }

    try {
      const url = selectedTask ? `/api/tasks/${selectedTask.id}` : "/api/tasks"
      const method = selectedTask ? "PATCH" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskFormData.title,
          description: taskFormData.description || null,
          status: taskFormData.status,
          priority: taskFormData.priority,
          projectId,
          dueDate: taskFormData.dueDate || null,
          assignedToId: taskFormData.assignedToId || null,
        }),
      })

      if (res.ok) {
        setShowTaskModal(false)
        setTaskFormData({ title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "", assignedToId: "" })
        setSelectedTask(null)
        fetchProject()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to save task")
      }
    } catch (err) {
      setError("An error occurred while saving the task")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchProject()
    } catch (err) {
      console.error("Failed to update task status")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      fetchProject()
    } catch (err) {
      setError("Failed to delete task")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
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

  const tasksByStatus = taskStatusColumns.reduce((acc, status) => {
    acc[status] = project.tasks.filter((t) => t.status === status)
    return acc
  }, {} as Record<string, Task[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-700">
                ← Back to Projects
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="mt-1 text-sm text-gray-500">{project.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[project.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {project.status.replace("_", " ")}
              </span>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + New Task
              </button>
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {(["tasks", "resources", "team"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
                {tab === "tasks" && ` (${project.tasks.length})`}
                {tab === "resources" && ` (${project.resources.length})`}
                {tab === "team" && ` (${project.projectMembers.length})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {taskStatusColumns.map((status) => (
              <div
                key={status}
                className="bg-gray-100 rounded-lg p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const taskId = e.dataTransfer.getData("taskId")
                  if (taskId && status) {
                    handleUpdateTaskStatus(taskId, status)
                  }
                }}
              >
                <h3 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">
                  {status.replace("_", " ")}
                  <span className="ml-2 text-gray-500">({tasksByStatus[status]?.length || 0})</span>
                </h3>
                <div className="space-y-3 min-h-[100px]">
                  {tasksByStatus[status]?.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("taskId", task.id)
                        e.dataTransfer.effectAllowed = "move"
                      }}
                      onClick={() => {
                        setSelectedTask(task)
                        setTaskFormData({
                          title: task.title,
                          description: task.description || "",
                          status: task.status,
                          priority: task.priority,
                          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
                          assignedToId: task.assignedTo?.id || "",
                        })
                        setShowTaskModal(true)
                      }}
                      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-move"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            priorityColors[task.priority] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{task.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        {task.assignedTo ? (
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
                              {task.assignedTo.user.name?.[0] || task.assignedTo.user.email[0].toUpperCase()}
                            </div>
                            <span className="ml-2 text-xs text-gray-500">
                              {task.assignedTo.user.name || task.assignedTo.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unassigned</span>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedTask(null)
                      setTaskFormData({ title: "", description: "", status, priority: "MEDIUM", dueDate: "", assignedToId: "" })
                      setShowTaskModal(true)
                    }}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                  >
                    + Add Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div className="bg-white shadow rounded-lg">
            {project.resources.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No resources</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a resource.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {project.resources.map((resource) => (
                  <li key={resource.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="h-10 w-10 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                          <p className="text-sm text-gray-500">{resource.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === "team" && (
          <div className="bg-white shadow rounded-lg">
            {project.projectMembers.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding team members.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {project.projectMembers.map((member) => (
                  <li key={member.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                          {member.teamMember.user.name?.[0] || member.teamMember.user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {member.teamMember.user.name || member.teamMember.user.email}
                          </p>
                          <p className="text-sm text-gray-500">{member.teamMember.user.email}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {member.teamMember.role}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTask ? "Edit Task" : "Create New Task"}
              </h3>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="taskTitle"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="taskDescription"
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    placeholder="Optional description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="taskStatus"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={taskFormData.status}
                      onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                    >
                      {taskStatusColumns.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="taskPriority"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="taskDueDate"
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="taskAssignee" className="block text-sm font-medium text-gray-700">
                    Assign To
                  </label>
                  <select
                    id="taskAssignee"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={taskFormData.assignedToId || ""}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedToId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {project.projectMembers.map((pm) => (
                      <option key={pm.teamMember.id} value={pm.teamMember.id}>
                        {pm.teamMember.user.name || pm.teamMember.user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-between rounded-b-lg">
                {selectedTask && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteTask(selectedTask.id)
                      setShowTaskModal(false)
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                )}
                <div className="flex space-x-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskModal(false)
                      setSelectedTask(null)
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
                    {submitting ? "Saving..." : selectedTask ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
