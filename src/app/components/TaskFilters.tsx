"use client"

import { useState } from "react"

interface TaskFiltersProps {
  onFilterChange: (filters: FilterState) => void
  teamMembers?: Array<{
    id: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
}

export interface FilterState {
  status: string[]
  priority: string[]
  assignee: string
  dueDateFrom: string
  dueDateTo: string
  sortBy: string
  sortOrder: "asc" | "desc"
  searchQuery: string
}

const statusOptions = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
]

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
]

const sortOptions = [
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" },
  { value: "dueDate", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
]

export default function TaskFilters({ onFilterChange, teamMembers = [] }: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    assignee: "",
    dueDateFrom: "",
    dueDateTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    searchQuery: "",
  })

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFilterChange(updated)
  }

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status]
    updateFilters({ status: newStatus })
  }

  const togglePriority = (priority: string) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority]
    updateFilters({ priority: newPriority })
  }

  const clearFilters = () => {
    const cleared: FilterState = {
      status: [],
      priority: [],
      assignee: "",
      dueDateFrom: "",
      dueDateTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      searchQuery: "",
    }
    setFilters(cleared)
    onFilterChange(cleared)
  }

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.assignee ||
    filters.dueDateFrom ||
    filters.dueDateTo ||
    filters.searchQuery

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-4 sm:px-6">
        {/* Search and Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filters.searchQuery}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              className="block w-full sm:w-auto border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={filters.sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                updateFilters({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })
              }
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {filters.sortOrder === "asc" ? (
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              )}
            </button>
          </div>

          {/* Toggle Filters */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
              hasActiveFilters
                ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            }`}
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={filters.status.includes(option.value)}
                        onChange={() => toggleStatus(option.value)}
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="space-y-2">
                  {priorityOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={filters.priority.includes(option.value)}
                        onChange={() => togglePriority(option.value)}
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                <select
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.assignee}
                  onChange={(e) => updateFilters({ assignee: e.target.value })}
                >
                  <option value="">All assignees</option>
                  <option value="unassigned">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.user.name || member.user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    placeholder="From"
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={filters.dueDateFrom}
                    onChange={(e) => updateFilters({ dueDateFrom: e.target.value })}
                  />
                  <input
                    type="date"
                    placeholder="To"
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={filters.dueDateTo}
                    onChange={(e) => updateFilters({ dueDateTo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to filter tasks based on filter state
export function filterTasks<T extends {
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
  assignedTo?: { id: string } | null
}>(tasks: T[], filters: FilterState): T[] {
  return tasks.filter((task) => {
    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const matchesTitle = task.title.toLowerCase().includes(query)
      const matchesDescription = task.description?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription) return false
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false
    }

    // Assignee filter
    if (filters.assignee) {
      if (filters.assignee === "unassigned" && task.assignedTo) return false
      if (filters.assignee !== "unassigned" && task.assignedTo?.id !== filters.assignee) return false
    }

    // Due date filter
    if (filters.dueDateFrom && task.dueDate) {
      if (new Date(task.dueDate) < new Date(filters.dueDateFrom)) return false
    }
    if (filters.dueDateTo && task.dueDate) {
      if (new Date(task.dueDate) > new Date(filters.dueDateTo)) return false
    }

    return true
  })
}

// Helper function to sort tasks based on filter state
export function sortTasks<T extends {
  title: string
  createdAt: string
  updatedAt?: string
  dueDate?: string | null
  priority: string
}>(tasks: T[], filters: FilterState): T[] {
  const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }

  return [...tasks].sort((a, b) => {
    let comparison = 0

    switch (filters.sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title)
        break
      case "priority":
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) -
                     (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
        break
      case "dueDate":
        if (!a.dueDate && !b.dueDate) comparison = 0
        else if (!a.dueDate) comparison = 1
        else if (!b.dueDate) comparison = -1
        else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        break
      case "updatedAt":
        comparison = new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime()
        break
      case "createdAt":
      default:
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
    }

    return filters.sortOrder === "asc" ? comparison : -comparison
  })
}
