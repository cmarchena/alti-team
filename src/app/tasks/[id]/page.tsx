"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
  }
  assignedTo: {
    id: string
    role: string
    position: string | null
    user: {
      id: string
      name: string | null
      email: string
    }
  } | null
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
  }
}

interface TeamMember {
  id: string
  role: string
  position: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
}

const statusOptions = [
  { value: "TODO", label: "To Do", color: "bg-gray-100 text-gray-800" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-800" },
  { value: "IN_REVIEW", label: "In Review", color: "bg-yellow-100 text-yellow-800" },
  { value: "DONE", label: "Done", color: "bg-green-100 text-green-800" },
]

const priorityOptions = [
  { value: "LOW", label: "Low", color: "bg-gray-100 text-gray-600" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-100 text-blue-600" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-600" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-600" },
]

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
    assignedToId: "",
  })

  // Comment form
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (taskId) {
      fetchTask()
      fetchComments()
    }
  }, [taskId])

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`)
      if (res.ok) {
        const data = await res.json()
        setTask(data.task)
        setFormData({
          title: data.task.title,
          description: data.task.description || "",
          status: data.task.status,
          priority: data.task.priority,
          dueDate: data.task.dueDate ? data.task.dueDate.split("T")[0] : "",
          assignedToId: data.task.assignedTo?.id || "",
        })
        // Fetch team members for the project
        if (data.task.project?.id) {
          fetchTeamMembers(data.task.project.id)
        }
      } else if (res.status === 401) {
        router.push("/auth/signin")
      } else if (res.status === 403 || res.status === 404) {
        router.push("/projects")
      } else {
        setError("Failed to load task")
      }
    } catch (err) {
      setError("An error occurred while loading task")
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments)
      }
    } catch (err) {
      console.error("Failed to fetch comments")
    }
  }

  const fetchTeamMembers = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const data = await res.json()
        // Extract team members from project members
        const members = data.project.projectMembers?.map((pm: { teamMember: TeamMember }) => pm.teamMember) || []
        setTeamMembers(members)
      }
    } catch (err) {
      console.error("Failed to fetch team members")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
          assignedToId: formData.assignedToId || null,
        }),
      })

      if (res.ok) {
        setSuccess("Task updated successfully")
        setIsEditing(false)
        fetchTask()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to update task")
      }
    } catch (err) {
      setError("An error occurred while updating")
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        setNewComment("")
        fetchComments()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to add comment")
      }
    } catch (err) {
      setError("An error occurred while adding comment")
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError("")

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push(`/projects/${task?.project.id}`)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete task")
      }
    } catch (err) {
      setError("An error occurred while deleting")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find((p) => p.value === priority)?.color || "bg-gray-100 text-gray-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading task...</div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Task not found</h2>
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
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/projects/${task.project.id}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to {task.project.name}
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                {isEditing ? "Edit Task" : task.title}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing && (
                <>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {statusOptions.find((s) => s.value === task.status)?.label}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    {priorityOptions.find((p) => p.value === task.priority)?.label}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details / Edit Form */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          id="status"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          id="priority"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                          {priorityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                          Due Date
                        </label>
                        <input
                          type="date"
                          id="dueDate"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                          Assigned To
                        </label>
                        <select
                          id="assignedTo"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.assignedToId}
                          onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.user.name || member.user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {task.description || "No description provided."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Comments ({comments.length})
                </h3>

                {/* Comment Form */}
                <form onSubmit={handleAddComment} className="mb-6">
                  <textarea
                    rows={3}
                    placeholder="Add a comment..."
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {submittingComment ? "Adding..." : "Add Comment"}
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 text-sm font-medium">
                                {comment.author.name?.[0] || comment.author.email[0].toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {comment.author.name || comment.author.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDateTime(comment.createdAt)}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {task.assignedTo ? (
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                            <span className="text-indigo-600 text-xs font-medium">
                              {task.assignedTo.user.name?.[0] || task.assignedTo.user.email[0].toUpperCase()}
                            </span>
                          </div>
                          {task.assignedTo.user.name || task.assignedTo.user.email}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {task.dueDate ? formatDate(task.dueDate) : <span className="text-gray-400">No due date</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Project</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <Link href={`/projects/${task.project.id}`} className="text-indigo-600 hover:text-indigo-500">
                        {task.project.name}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(task.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(task.updatedAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong>{task.title}</strong>? This action cannot be undone.
              </p>
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
                  setError("")
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
