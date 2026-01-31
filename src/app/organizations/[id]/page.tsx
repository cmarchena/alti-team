"use client"

import { useState, useEffect, useParams } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import OrgChart from "@/components/OrgChart"

interface Organization {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count?: {
    departments: number
    teamMembers: number
    projects: number
  }
}

interface Department {
  id: string
  name: string
  description: string | null
  parentId: string | null
  parent?: { id: string; name: string }
  children?: { id: string; name: string }[]
  _count?: {
    teamMembers: number
    processes: number
  }
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params?.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
      const [orgRes, deptRes] = await Promise.all([
        fetch(`/api/organizations/${organizationId}`),
        fetch(`/api/departments?organizationId=${organizationId}`),
      ])

      if (!orgRes.ok) {
        if (orgRes.status === 401 || orgRes.status === 403) {
          router.push("/auth/signin")
          return
        }
        throw new Error("Failed to load organization")
      }

      const orgData = await orgRes.json()
      setOrganization(orgData.organization)

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
              <button
                onClick={() => setShowCreateDeptModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + New Department
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

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Departments</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {organization._count?.departments || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {organization._count?.teamMembers || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Projects</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {organization._count?.projects || 0}
              </dd>
            </div>
          </div>
        </div>

        {/* Departments Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Organigrama</h3>
            <button
              onClick={() => setShowCreateDeptModal(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Add Department
            </button>
          </div>
          <div className="p-6">
            <OrgChart
              departments={departments}
              onEdit={(dept) => {
                setSelectedDept(dept)
                setDeptFormData({
                  name: dept.name,
                  description: dept.description || "",
                  parentId: dept.parentId || "",
                })
                // Would open edit modal - for now just show create
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
          </div>
        </div>
      </main>

      {/* Create Department Modal */}
      {showCreateDeptModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create New Department</h3>
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
                      .filter((d) => d.id !== deptFormData.id)
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
                  {submitting ? "Creating..." : "Create Department"}
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
