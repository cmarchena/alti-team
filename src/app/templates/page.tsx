"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ProjectTemplate {
  id: string
  name: string
  description: string
  taskCount: number
  category: string
}

interface Organization {
  id: string
  name: string
}

// Predefined project templates
const defaultTemplates: ProjectTemplate[] = [
  {
    id: "software-dev",
    name: "Software Development",
    description: "Standard software development project with planning, development, testing, and deployment phases.",
    taskCount: 12,
    category: "Development",
  },
  {
    id: "marketing-campaign",
    name: "Marketing Campaign",
    description: "Marketing campaign template with research, content creation, launch, and analysis phases.",
    taskCount: 10,
    category: "Marketing",
  },
  {
    id: "product-launch",
    name: "Product Launch",
    description: "Product launch template covering pre-launch, launch day, and post-launch activities.",
    taskCount: 15,
    category: "Product",
  },
  {
    id: "event-planning",
    name: "Event Planning",
    description: "Event planning template with venue, logistics, promotion, and execution tasks.",
    taskCount: 18,
    category: "Events",
  },
  {
    id: "website-redesign",
    name: "Website Redesign",
    description: "Website redesign project with discovery, design, development, and launch phases.",
    taskCount: 14,
    category: "Development",
  },
  {
    id: "onboarding",
    name: "Employee Onboarding",
    description: "New employee onboarding checklist with HR, IT, and team introduction tasks.",
    taskCount: 8,
    category: "HR",
  },
]

const templateTasks: Record<string, Array<{ title: string; status: string; priority: string }>> = {
  "software-dev": [
    { title: "Define project requirements", status: "TODO", priority: "HIGH" },
    { title: "Create technical specification", status: "TODO", priority: "HIGH" },
    { title: "Set up development environment", status: "TODO", priority: "MEDIUM" },
    { title: "Design system architecture", status: "TODO", priority: "HIGH" },
    { title: "Implement core features", status: "TODO", priority: "HIGH" },
    { title: "Write unit tests", status: "TODO", priority: "MEDIUM" },
    { title: "Code review", status: "TODO", priority: "MEDIUM" },
    { title: "Integration testing", status: "TODO", priority: "HIGH" },
    { title: "Performance optimization", status: "TODO", priority: "MEDIUM" },
    { title: "Security audit", status: "TODO", priority: "HIGH" },
    { title: "Deploy to staging", status: "TODO", priority: "MEDIUM" },
    { title: "Production deployment", status: "TODO", priority: "URGENT" },
  ],
  "marketing-campaign": [
    { title: "Market research", status: "TODO", priority: "HIGH" },
    { title: "Define target audience", status: "TODO", priority: "HIGH" },
    { title: "Create campaign strategy", status: "TODO", priority: "HIGH" },
    { title: "Design creative assets", status: "TODO", priority: "MEDIUM" },
    { title: "Write copy", status: "TODO", priority: "MEDIUM" },
    { title: "Set up tracking", status: "TODO", priority: "MEDIUM" },
    { title: "Launch campaign", status: "TODO", priority: "URGENT" },
    { title: "Monitor performance", status: "TODO", priority: "HIGH" },
    { title: "A/B testing", status: "TODO", priority: "MEDIUM" },
    { title: "Campaign analysis report", status: "TODO", priority: "HIGH" },
  ],
  "product-launch": [
    { title: "Finalize product features", status: "TODO", priority: "URGENT" },
    { title: "Create launch timeline", status: "TODO", priority: "HIGH" },
    { title: "Prepare marketing materials", status: "TODO", priority: "HIGH" },
    { title: "Set up landing page", status: "TODO", priority: "HIGH" },
    { title: "Create press release", status: "TODO", priority: "MEDIUM" },
    { title: "Coordinate with sales team", status: "TODO", priority: "HIGH" },
    { title: "Prepare customer support", status: "TODO", priority: "HIGH" },
    { title: "Beta testing", status: "TODO", priority: "HIGH" },
    { title: "Fix critical bugs", status: "TODO", priority: "URGENT" },
    { title: "Launch day checklist", status: "TODO", priority: "URGENT" },
    { title: "Monitor launch metrics", status: "TODO", priority: "HIGH" },
    { title: "Gather initial feedback", status: "TODO", priority: "HIGH" },
    { title: "Post-launch review", status: "TODO", priority: "MEDIUM" },
    { title: "Plan iteration", status: "TODO", priority: "MEDIUM" },
    { title: "Update documentation", status: "TODO", priority: "LOW" },
  ],
  "event-planning": [
    { title: "Define event objectives", status: "TODO", priority: "HIGH" },
    { title: "Set budget", status: "TODO", priority: "HIGH" },
    { title: "Choose venue", status: "TODO", priority: "URGENT" },
    { title: "Book vendors", status: "TODO", priority: "HIGH" },
    { title: "Create event schedule", status: "TODO", priority: "HIGH" },
    { title: "Design invitations", status: "TODO", priority: "MEDIUM" },
    { title: "Send invitations", status: "TODO", priority: "HIGH" },
    { title: "Manage RSVPs", status: "TODO", priority: "MEDIUM" },
    { title: "Coordinate catering", status: "TODO", priority: "HIGH" },
    { title: "Arrange transportation", status: "TODO", priority: "MEDIUM" },
    { title: "Set up AV equipment", status: "TODO", priority: "HIGH" },
    { title: "Prepare signage", status: "TODO", priority: "LOW" },
    { title: "Brief staff", status: "TODO", priority: "HIGH" },
    { title: "Day-of coordination", status: "TODO", priority: "URGENT" },
    { title: "Post-event cleanup", status: "TODO", priority: "MEDIUM" },
    { title: "Send thank you notes", status: "TODO", priority: "LOW" },
    { title: "Collect feedback", status: "TODO", priority: "MEDIUM" },
    { title: "Event debrief", status: "TODO", priority: "MEDIUM" },
  ],
  "website-redesign": [
    { title: "Audit current website", status: "TODO", priority: "HIGH" },
    { title: "Define goals and KPIs", status: "TODO", priority: "HIGH" },
    { title: "User research", status: "TODO", priority: "HIGH" },
    { title: "Create sitemap", status: "TODO", priority: "MEDIUM" },
    { title: "Wireframe key pages", status: "TODO", priority: "HIGH" },
    { title: "Design mockups", status: "TODO", priority: "HIGH" },
    { title: "Get design approval", status: "TODO", priority: "HIGH" },
    { title: "Set up development environment", status: "TODO", priority: "MEDIUM" },
    { title: "Develop frontend", status: "TODO", priority: "HIGH" },
    { title: "Integrate CMS", status: "TODO", priority: "MEDIUM" },
    { title: "Content migration", status: "TODO", priority: "HIGH" },
    { title: "QA testing", status: "TODO", priority: "HIGH" },
    { title: "SEO optimization", status: "TODO", priority: "MEDIUM" },
    { title: "Launch website", status: "TODO", priority: "URGENT" },
  ],
  "onboarding": [
    { title: "Prepare workstation", status: "TODO", priority: "HIGH" },
    { title: "Set up accounts and access", status: "TODO", priority: "URGENT" },
    { title: "Complete HR paperwork", status: "TODO", priority: "HIGH" },
    { title: "Team introduction meeting", status: "TODO", priority: "HIGH" },
    { title: "Review company policies", status: "TODO", priority: "MEDIUM" },
    { title: "Product/service training", status: "TODO", priority: "HIGH" },
    { title: "Assign mentor", status: "TODO", priority: "MEDIUM" },
    { title: "30-day check-in", status: "TODO", priority: "MEDIUM" },
  ],
}

export default function TemplatesPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organizationId: "",
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations")
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data.organizations)
        if (data.organizations.length > 0) {
          setFormData((prev) => ({ ...prev, organizationId: data.organizations[0].id }))
        }
      } else if (res.status === 401) {
        router.push("/auth/signin")
      }
    } catch (err) {
      setError("Failed to load organizations")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      organizationId: organizations[0]?.id || "",
    })
    setShowCreateModal(true)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    setCreating(true)
    setError("")

    try {
      // Create the project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          organizationId: formData.organizationId,
          status: "PLANNING",
        }),
      })

      if (!projectRes.ok) {
        const data = await projectRes.json()
        throw new Error(data.error || "Failed to create project")
      }

      const { project } = await projectRes.json()

      // Create tasks from template
      const tasks = templateTasks[selectedTemplate.id] || []
      for (const task of tasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            status: task.status,
            priority: task.priority,
            projectId: project.id,
          }),
        })
      }

      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setCreating(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Development: "bg-blue-100 text-blue-800",
      Marketing: "bg-green-100 text-green-800",
      Product: "bg-purple-100 text-purple-800",
      Events: "bg-yellow-100 text-yellow-800",
      HR: "bg-pink-100 text-pink-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading templates...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Project Templates</h1>
              <p className="mt-1 text-sm text-gray-500">
                Start your project with a pre-built template
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Projects
            </Link>
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

        {organizations.length === 0 ? (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create an organization first to use project templates.
            </p>
            <div className="mt-6">
              <Link
                href="/organizations"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Organization
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                        template.category
                      )}`}
                    >
                      {template.category}
                    </span>
                    <span className="text-sm text-gray-500">{template.taskCount} tasks</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.description}</p>
                  <button className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50">
                    Use Template
                  </button>
                </div>
              </div>
            ))}

            {/* Create Custom Template Card */}
            <div className="bg-white rounded-lg shadow border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
              <Link href="/projects" className="block p-6 h-full">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Start from Scratch</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Create a blank project and add your own tasks
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create Project from Template</h3>
              <p className="mt-1 text-sm text-gray-500">
                Using: {selectedTemplate.name}
              </p>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                    Organization *
                  </label>
                  <select
                    id="organization"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-600">
                    This will create a project with <strong>{selectedTemplate.taskCount} tasks</strong> from the template.
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setSelectedTemplate(null)
                    setError("")
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
