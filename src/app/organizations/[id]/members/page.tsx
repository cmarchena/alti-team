"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

interface TeamMember {
  id: string
  role: string
  position: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  department: {
    id: string
    name: string
  } | null
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
  department: {
    id: string
    name: string
  } | null
}

interface Department {
  id: string
  name: string
}

interface Organization {
  id: string
  name: string
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  MANAGER: "bg-blue-100 text-blue-800",
  MEMBER: "bg-gray-100 text-gray-800",
}

export default function OrganizationMembersPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params?.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"members" | "invitations">("members")

  // Invite modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    role: "MEMBER",
    departmentId: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [invitationLink, setInvitationLink] = useState("")

  useEffect(() => {
    if (organizationId) {
      fetchData()
    }
  }, [organizationId])

  const fetchData = async () => {
    try {
      const [orgRes, deptRes, invRes] = await Promise.all([
        fetch(`/api/organizations/${organizationId}`),
        fetch(`/api/departments?organizationId=${organizationId}`),
        fetch(`/api/invitations?organizationId=${organizationId}`),
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
      setMembers(orgData.organization.teamMembers || [])

      if (deptRes.ok) {
        const deptData = await deptRes.json()
        setDepartments(deptData.departments || [])
      }

      if (invRes.ok) {
        const invData = await invRes.json()
        setInvitations(invData.invitations || [])
      }
    } catch (err) {
      setError("An error occurred while loading data")
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setInvitationLink("")

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteFormData.email,
          role: inviteFormData.role,
          organizationId,
          departmentId: inviteFormData.departmentId || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setInvitationLink(data.invitation.invitationLink)
        fetchData()
      } else {
        setError(data.error || "Failed to send invitation")
      }
    } catch (err) {
      setError("An error occurred while sending the invitation")
    } finally {
      setSubmitting(false)
    }
  }

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink)
  }

  const closeInviteModal = () => {
    setShowInviteModal(false)
    setInviteFormData({ email: "", role: "MEMBER", departmentId: "" })
    setInvitationLink("")
    setError("")
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
              <Link
                href={`/organizations/${organizationId}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to {organization.name}
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Team Members</h1>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Invite Member
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("members")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "members"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "invitations"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Invitations ({invitations.length})
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

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="bg-white shadow rounded-lg">
            {members.length === 0 ? (
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
                <p className="mt-1 text-sm text-gray-500">
                  Get started by inviting team members.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    + Invite Member
                  </button>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {members.map((member) => (
                  <li key={member.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                          {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {member.user.name || member.user.email}
                          </p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                          {member.position && (
                            <p className="text-xs text-gray-400">{member.position}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {member.department && (
                          <span className="text-sm text-gray-500">{member.department.name}</span>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            roleColors[member.role] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === "invitations" && (
          <div className="bg-white shadow rounded-lg">
            {invitations.length === 0 ? (
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending invitations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All invitations have been accepted or expired.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                          {invitation.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {invitation.department && (
                          <span className="text-sm text-gray-500">{invitation.department.name}</span>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            roleColors[invitation.role] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {invitation.role}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invite Team Member</h3>
            </div>
            {invitationLink ? (
              <div className="px-6 py-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Invitation Created!</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Share this link with the invitee:
                  </p>
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600 break-all">{invitationLink}</p>
                  </div>
                  <button
                    onClick={copyInvitationLink}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Copy Link
                  </button>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeInviteModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="px-6 py-4 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={inviteFormData.email}
                      onChange={(e) =>
                        setInviteFormData({ ...inviteFormData, email: e.target.value })
                      }
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={inviteFormData.role}
                      onChange={(e) =>
                        setInviteFormData({ ...inviteFormData, role: e.target.value })
                      }
                    >
                      <option value="MEMBER">Member</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      Department (Optional)
                    </label>
                    <select
                      id="department"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={inviteFormData.departmentId}
                      onChange={(e) =>
                        setInviteFormData({ ...inviteFormData, departmentId: e.target.value })
                      }
                    >
                      <option value="">No department</option>
                      {departments.map((dept) => (
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
                    onClick={closeInviteModal}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
