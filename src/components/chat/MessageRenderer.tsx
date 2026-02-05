'use client'

import { useState } from 'react'

interface Task extends Record<string, unknown> {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  projectId?: string
  assigneeId?: string
  dueDate?: string
}

interface Project extends Record<string, unknown> {
  id: string
  name: string
  description?: string
  status: string
  organizationId?: string
  createdAt?: string
}

interface User extends Record<string, unknown> {
  id: string
  name?: string
  email?: string
  role?: string
}

interface Resource extends Record<string, unknown> {
  id: string
  name: string
  resourceType?: string
  projectId?: string
}

interface Notification extends Record<string, unknown> {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
}

interface SearchResults {
  query: string
  results: {
    projects?: Project[]
    tasks?: Task[]
    users?: User[]
    resources?: Resource[]
  }
  counts: {
    projects: number
    tasks: number
    users: number
    resources: number
  }
}

interface MessageRendererProps {
  content: string
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}

const statusColors: Record<string, string> = {
  done: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  todo: 'bg-gray-100 text-gray-800',
  planning: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  'on-hold': 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
}

function getStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

function getPriorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

function TaskCard({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 my-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{task.title}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}`}
            >
              {getPriorityLabel(task.priority)}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}`}
            >
              {getStatusLabel(task.status)}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}
          {expanded && (
            <div className="text-xs text-gray-500 space-y-1 mt-2 pt-2 border-t border-gray-100">
              {task.projectId && <p>Project ID: {task.projectId}</p>}
              {task.assigneeId && <p>Assignee ID: {task.assigneeId}</p>}
              {task.dueDate && (
                <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 my-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-4 h-4 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <h4 className="font-medium text-gray-900">{project.name}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-gray-600">{project.description}</p>
          )}
          {expanded && project.createdAt && (
            <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

function UserListItem({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
        <span className="text-indigo-600 font-medium text-sm">
          {user.name?.[0]?.toUpperCase() ||
            user.email?.[0]?.toUpperCase() ||
            '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {user.name || 'Unknown'}
        </p>
        <p className="text-sm text-gray-500 truncate">{user.email}</p>
      </div>
      {user.role && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            user.role === 'admin'
              ? 'bg-purple-100 text-purple-800'
              : user.role === 'member'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {getStatusLabel(user.role)}
        </span>
      )}
    </div>
  )
}

function ResourceItem({ resource }: { resource: Resource }) {
  const typeIcons: Record<string, JSX.Element> = {
    file: (
      <svg
        className="w-4 h-4 text-blue-600"
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
    ),
    link: (
      <svg
        className="w-4 h-4 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
    note: (
      <svg
        className="w-4 h-4 text-yellow-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  }

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
        {typeIcons[resource.resourceType || 'file'] || typeIcons.file}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{resource.name}</p>
        <p className="text-xs text-gray-500 capitalize">
          {resource.resourceType || 'file'}
        </p>
      </div>
    </div>
  )
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'}`}
    >
      <div
        className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`}
      />
      <div className="flex-1">
        <p
          className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}
        >
          {notification.message}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function SimpleTable({ data }: { data: Record<string, string>[] }) {
  if (!data || data.length === 0) return null

  const headers = Object.keys(data[0])

  return (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 text-left font-medium text-gray-700 capitalize"
              >
                {header.replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              {headers.map((header) => (
                <td key={header} className="px-3 py-2 text-gray-600">
                  {String(row[header] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
          {line.slice(3)}
        </h3>,
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-base font-medium text-gray-900 mt-3 mb-1">
          {line.slice(4)}
        </h4>,
      )
    } else if (line.startsWith('- ')) {
      let j = i
      const items: string[] = []
      while (j < lines.length && lines[j].startsWith('- ')) {
        items.push(lines[j].slice(2))
        j++
      }
      elements.push(
        <ul key={i} className="list-disc list-inside my-2 space-y-1">
          {items.map((item, k) => (
            <li key={k} className="text-gray-700">
              {item}
            </li>
          ))}
        </ul>,
      )
      i = j - 1
    } else if (/^\d+\.\s/.test(line)) {
      let j = i
      const items: string[] = []
      while (j < lines.length && /^\d+\.\s/.test(lines[j])) {
        items.push(lines[j].replace(/^\d+\.\s/, ''))
        j++
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside my-2 space-y-1">
          {items.map((item, k) => (
            <li key={k} className="text-gray-700">
              {item}
            </li>
          ))}
        </ol>,
      )
      i = j - 1
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="font-semibold text-gray-900 my-2">
          {line.slice(2, -2)}
        </p>,
      )
    } else if (line.includes('**')) {
      const parts = line.split('**')
      elements.push(
        <p key={i} className="text-gray-700 my-1">
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="font-semibold">
                {part}
              </strong>
            ) : (
              part
            ),
          )}
        </p>,
      )
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-gray-700 my-1">
          {line}
        </p>,
      )
    }

    i++
  }

  return <div className="space-y-1">{elements}</div>
}

export default function MessageRenderer({ content }: MessageRendererProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({})

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  try {
    const parsed = JSON.parse(content)

    if (parsed.results || parsed.counts) {
      const results = parsed as SearchResults
      return (
        <div className="space-y-4">
          {parsed.query && (
            <p className="text-sm text-gray-600 mb-2">
              Search results for "{parsed.query}":
            </p>
          )}
          {results.counts.projects > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="font-medium text-gray-900">
                  Projects ({results.counts.projects})
                </span>
              </div>
              {results.results.projects?.slice(0, 3).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
              {results.results.projects &&
                results.results.projects.length > 3 && (
                  <p className="text-xs text-gray-500 mt-1">
                    ...and {results.results.projects.length - 3} more
                  </p>
                )}
            </div>
          )}
          {results.counts.tasks > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <span className="font-medium text-gray-900">
                  Tasks ({results.counts.tasks})
                </span>
              </div>
              {results.results.tasks?.slice(0, 3).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {results.results.tasks && results.results.tasks.length > 3 && (
                <p className="text-xs text-gray-500 mt-1">
                  ...and {results.results.tasks.length - 3} more
                </p>
              )}
            </div>
          )}
          {results.counts.users > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-green-600"
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
                <span className="font-medium text-gray-900">
                  Users ({results.counts.users})
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                {results.results.users?.slice(0, 5).map((user) => (
                  <UserListItem key={user.id} user={user} />
                ))}
              </div>
              {results.results.users && results.results.users.length > 5 && (
                <p className="text-xs text-gray-500 mt-1">
                  ...and {results.results.users.length - 5} more
                </p>
              )}
            </div>
          )}
          {results.counts.resources > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-blue-600"
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
                <span className="font-medium text-gray-900">
                  Resources ({results.counts.resources})
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                {results.results.resources?.slice(0, 5).map((resource) => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )}
          {results.counts.projects === 0 &&
            results.counts.tasks === 0 &&
            results.counts.users === 0 &&
            results.counts.resources === 0 && (
              <p className="text-gray-500 italic">No results found</p>
            )}
        </div>
      )
    }

    if (Array.isArray(parsed)) {
      const firstItem = parsed[0]
      if (firstItem?.type === 'task') {
        return (
          <div>
            {parsed.map((task, i) => (
              <TaskCard key={task.id || i} task={task} />
            ))}
          </div>
        )
      }
      if (firstItem?.type === 'project') {
        return (
          <div>
            {parsed.map((project, i) => (
              <ProjectCard key={project.id || i} project={project} />
            ))}
          </div>
        )
      }
      if (firstItem?.type === 'user') {
        return (
          <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
            {parsed.map((user, i) => (
              <UserListItem key={user.id || i} user={user} />
            ))}
          </div>
        )
      }
      if (firstItem?.type === 'notification') {
        return (
          <div className="space-y-2">
            {parsed.map((notification, i) => (
              <NotificationItem
                key={notification.id || i}
                notification={notification}
              />
            ))}
          </div>
        )
      }
      if (typeof firstItem === 'object') {
        return <SimpleTable data={parsed} />
      }
    }

    if (parsed.projectId && parsed.projectName && parsed.analytics) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="font-semibold text-gray-900">
              {parsed.projectName}
            </h3>
          </div>
          <SimpleTable
            data={Object.entries(parsed.analytics).map(([key, value]) => ({
              metric: key.replace(/([A-Z])/g, ' $1').trim(),
              value:
                typeof value === 'object'
                  ? JSON.stringify(value)
                  : String(value),
            }))}
          />
        </div>
      )
    }

    if (parsed.message) {
      return <MarkdownContent content={parsed.message} />
    }
  } catch {}

  return <MarkdownContent content={content} />
}
