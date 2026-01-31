"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    departments: number
    teamMembers: number
    projects: number
    invitations: number
  }
}

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const organizationId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (organizationId) {
      fetchOrganization()
    }
  }, [organizationId])

  const fetchOrganization = async () => {
    try {
      const res = await fetch(`/api/organizations/${organizationId}`)
      if (res.ok) {
        const data = await res.json()
        setOrganization(data.organization)
        setFormData({
          name: data.organization.name,
          description: data.organization.description || "",
        })
      } else if (res.status === 401) {
        router.push("/auth/signin")
      } else if (res.status === 403) {
        router.push("/organizations")
      } else if (res.status === 404) {
        router.push("/organizations")
      } else {
        setError("Failed to load organization")
      }
    } catch (err) {
      setError("An error occurred while loading organization")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/organizations/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSuccess("Organization updated successfully")
        fetchOrganization()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to update organization")
      }
    } catch (err) {
      setError("An error occurred while updating")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError("")

    try {
      const res = await fetch(`/api/organizations/${organizationId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/organizations")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete organization")
      }
    } catch (err) {
      setError("An error occurred while deleting")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your organization settings
              </p>
            </div>
            <a
              href={`/organizations/${organizationId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Organization
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

        {/* General Settings */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              General Information
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Organization Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Organization Details
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization?.owner.name || organization?.owner.email}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization?.createdAt ? formatDate(organization.createdAt) : "-"}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Members</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization?._count.teamMembers || 0}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Departments</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization?._count.departments || 0}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Projects</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization?._count.projects || 0}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Pending Invitations</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization?._count.invitations || 0}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white shadow rounded-lg border border-red-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-red-600 mb-4">
              Danger Zone
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Deleting an organization will permanently remove all associated data including departments, projects, tasks, and resources. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Organization
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete Organization</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong>{organization?.name}</strong>?
                This will permanently remove:
              </p>
              <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                <li>{organization?._count.departments} departments</li>
                <li>{organization?._count.projects} projects</li>
                <li>{organization?._count.teamMembers} team members</li>
              </ul>
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
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Organization"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
