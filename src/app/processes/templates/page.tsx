"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ProcessTemplate {
  id: string
  name: string
  description: string
  stepCount: number
  category: string
}

interface Organization {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  organizationId: string
}

// Predefined process templates
const defaultTemplates: ProcessTemplate[] = [
  {
    id: "software-dev-process",
    name: "Software Development Process",
    description: "Standard software development lifecycle with planning, design, development, testing, and deployment phases.",
    stepCount: 8,
    category: "Development",
  },
  {
    id: "marketing-campaign-process",
    name: "Marketing Campaign Process",
    description: "Marketing campaign workflow from research to analysis and optimization.",
    stepCount: 7,
    category: "Marketing",
  },
  {
    id: "product-launch-process",
    name: "Product Launch Process",
    description: "Complete product launch process covering pre-launch, launch, and post-launch activities.",
    stepCount: 10,
    category: "Product",
  },
  {
    id: "hr-onboarding-process",
    name: "Employee Onboarding Process",
    description: "Comprehensive employee onboarding workflow for new hires.",
    stepCount: 6,
    category: "HR",
  },
  {
    id: "event-planning-process",
    name: "Event Planning Process",
    description: "Event planning and execution process from concept to follow-up.",
    stepCount: 9,
    category: "Events",
  },
]

const templateSteps: Record<string, Array<{ name: string; description?: string }>> = {
  "software-dev-process": [
    { name: "Requirements Gathering", description: "Collect and document project requirements" },
    { name: "System Design", description: "Design system architecture and specifications" },
    { name: "Development Setup", description: "Set up development environment and tools" },
    { name: "Implementation", description: "Develop the core functionality" },
    { name: "Code Review", description: "Review code for quality and standards" },
    { name: "Testing", description: "Perform comprehensive testing" },
    { name: "Deployment", description: "Deploy to production environment" },
    { name: "Post-Launch Support", description: "Monitor and support after launch" },
  ],
  "marketing-campaign-process": [
    { name: "Market Research", description: "Research target market and competitors" },
    { name: "Campaign Strategy", description: "Develop campaign objectives and strategy" },
    { name: "Content Creation", description: "Create marketing materials and content" },
    { name: "Channel Setup", description: "Set up marketing channels and platforms" },
    { name: "Campaign Launch", description: "Execute the campaign launch" },
    { name: "Performance Monitoring", description: "Track campaign performance metrics" },
    { name: "Analysis & Optimization", description: "Analyze results and optimize for future" },
  ],
  "product-launch-process": [
    { name: "Product Finalization", description: "Finalize product features and specifications" },
    { name: "Launch Planning", description: "Create detailed launch timeline and plan" },
    { name: "Marketing Preparation", description: "Prepare marketing materials and messaging" },
    { name: "Sales Training", description: "Train sales team on product features" },
    { name: "Beta Testing", description: "Conduct beta testing and gather feedback" },
    { name: "Pre-Launch Checklist", description: "Complete all pre-launch preparations" },
    { name: "Launch Day Execution", description: "Execute launch day activities" },
    { name: "Initial Monitoring", description: "Monitor launch performance and issues" },
    { name: "Customer Feedback", description: "Collect and analyze customer feedback" },
    { name: "Post-Launch Review", description: "Review launch success and lessons learned" },
  ],
  "hr-onboarding-process": [
    { name: "Pre-Start Preparation", description: "Prepare workstation and accounts" },
    { name: "First Day Orientation", description: "Welcome and company overview" },
    { name: "HR Paperwork", description: "Complete required HR documentation" },
    { name: "Team Introductions", description: "Meet team members and key stakeholders" },
    { name: "Training & Development", description: "Provide necessary training and resources" },
    { name: "30-Day Check-in", description: "Review progress and provide feedback" },
  ],
  "event-planning-process": [
    { name: "Event Concept Development", description: "Define event objectives and concept" },
    { name: "Budget Planning", description: "Create event budget and financial plan" },
    { name: "Venue Selection", description: "Choose and book appropriate venue" },
    { name: "Vendor Coordination", description: "Book vendors and service providers" },
    { name: "Marketing & Promotion", description: "Develop marketing and promotion strategy" },
    { name: "Logistics Planning", description: "Plan transportation, accommodation, and logistics" },
    { name: "Day-of-Event Management", description: "Manage event execution and coordination" },
    { name: "Post-Event Follow-up", description: "Send thank you notes and collect feedback" },
    { name: "Event Analysis", description: "Analyze event success and ROI" },
  ],
}

export default function ProcessTemplatesPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organizationId: "",
    departmentId: "",
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
          await fetchDepartments(data.organizations[0].id)
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

  const fetchDepartments = async (organizationId: string) => {
    try {
      const res = await fetch(`/api/departments?organizationId=${organizationId}`)
      if (res.ok) {
        const data = await res.json()
        setDepartments(data.departments)
        if (data.departments.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: data.departments[0].id }))
        }
      }
    } catch (err) {
      setError("Failed to load departments")
    }
  }

  const handleOrganizationChange = async (organizationId: string) => {
    setFormData((prev) => ({ ...prev, organizationId, departmentId: "" }))
    await fetchDepartments(organizationId)
  }

  const handleSelectTemplate = (template: ProcessTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      organizationId: organizations[0]?.id || "",
      departmentId: departments[0]?.id || "",
    })
    setShowCreateModal(true)
  }

  const handleCreateProcess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    setCreating(true)
    setError("")

    try {
      const steps = templateSteps[selectedTemplate.id] || []
      const normalizedSteps = steps.map((step, index) => ({
        id: `step-${index + 1}`,
        name: step.name,
        description: step.description || "",
        completed: false,
      }))

      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          steps: normalizedSteps,
          organizationId: formData.organizationId,
          departmentId: formData.departmentId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create process")
      }

      const { process } = await res.json()
      router.push(`/processes/${process.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create process")
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
              <h1 className="text-3xl font-bold text-gray-900">Process Templates</h1>
              <p className="mt-1 text-sm text-gray-500">
                Start your business process with a pre-built template
              </p>
            </div>
            <Link
              href="/processes"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Processes
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
              Create an organization first to use process templates.
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
                    <span className="text-sm text-gray-500">{template.stepCount} steps</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.description}</p>
                  <button className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50">
                    Use Template
                  </button>
                </div>
              </div>
            ))}

            {/* Create Custom Process Card */}
            <div className="bg-white rounded-lg shadow border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
              <Link href="/processes" className="block p-6 h-full">
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
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Create from Scratch</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Create a blank process and add your own steps
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Create Process Modal */}
      {showCreateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create Process from Template</h3>
              <p className="mt-1 text-sm text-gray-500">
                Using: {selectedTemplate.name}
              </p>
            </div>
            <form onSubmit={handleCreateProcess}>
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Process Name *
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
                    onChange={(e) => handleOrganizationChange(e.target.value)}
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department *
                  </label>
                  <select
                    id="department"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-600">
                    This will create a process with <strong>{selectedTemplate.stepCount} steps</strong> from the template.
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
                  {creating ? "Creating..." : "Create Process"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}