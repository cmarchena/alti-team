"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({ name: "", description: "" })

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
          selectOrganization(data.organizations[0])
        }
      } else if (res.status === 401) {
        router.push("/auth/signin")
      } else {
        setError("Failed to load organizations")
      }
    } catch (err) {
      setError("An error occurred while loading organizations")
    } finally {
      setLoading(false)
    }
  }

  const selectOrganization = async (org: Organization) => {
    setSelectedOrg(org)
    setFormData({
      name: org.name,
      description: org.description || "",
    })
    setError("")
    setSuccess("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrg) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/organizations/${selectedOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSuccess("Organization updated successfully")
        fetchOrganizations()
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
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your organization settings and preferences
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
              You don't have any organizations yet.
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Organization Selector */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Organizations</h3>
                  <nav className="space-y-1">
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => selectOrganization(org)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                          selectedOrg?.id === org.id
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {org.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Settings Form */}
            <div className="lg:col-span-3 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-600">{success}</p>
                </div>
              )}

              {/* General Settings */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Organization Name *
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

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Organization Info */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Information</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Owner</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedOrg?.owner.name || selectedOrg?.owner.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedOrg?.createdAt
                          ? new Date(selectedOrg.createdAt).toLocaleDateString()
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Team Members</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedOrg?._count.teamMembers || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Departments</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedOrg?._count.departments || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Projects</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedOrg?._count.projects || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Pending Invitations</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedOrg?._count.invitations || 0}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                      href={`/organizations/${selectedOrg?.id}`}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Organization Dashboard</div>
                        <div className="text-sm text-gray-500">View organization overview</div>
                      </div>
                    </Link>
                    <Link
                      href={`/organizations/${selectedOrg?.id}/members`}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Team Members</div>
                        <div className="text-sm text-gray-500">Manage team members</div>
                      </div>
                    </Link>
                    <Link
                      href={`/organizations/${selectedOrg?.id}/settings`}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Advanced Settings</div>
                        <div className="text-sm text-gray-500">Configure advanced options</div>
                      </div>
                    </Link>
                    <Link
                      href="/projects"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Projects</div>
                        <div className="text-sm text-gray-500">View all projects</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
