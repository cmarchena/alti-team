"use client"

import { useState, useCallback } from "react"

interface DepartmentChild {
  id: string
  name: string
  description?: string | null
  parentId?: string | null
}

interface Department {
  id: string
  name: string
  description: string | null
  parentId: string | null
  parent?: { id: string; name: string } | null
  children?: DepartmentChild[]
  _count?: {
    teamMembers: number
    processes: number
  }
}

interface OrgChartProps {
  departments: Department[]
  onEdit: (department: Department) => void
  onAddSub: (parentId: string) => void
  onDelete: (department: Department) => void
}

function DepartmentNode({
  department,
  depth,
  isExpanded,
  onToggle,
  onEdit,
  onAddSub,
  onDelete,
}: {
  department: Department
  depth: number
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onAddSub: () => void
  onDelete: () => void
}) {
  const hasChildren = (department.children?.length || 0) > 0
  const memberCount = department._count?.teamMembers || 0
  const processCount = department._count?.processes || 0

  return (
    <div className="flex flex-col">
      {/* Node Card */}
      <div className="relative">
        {/* Vertical line to children */}
        {hasChildren && (
          <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-gray-300" />
        )}
        
        <div className={`
          bg-white border rounded-lg shadow-sm p-4 min-w-[280px] max-w-[320px]
          ${hasChildren ? "mb-2" : ""}
          ${depth === 0 ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200"}
        `}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {hasChildren && (
                  <button
                    onClick={onToggle}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <h3 className="font-medium text-gray-900">{department.name}</h3>
              </div>
              {department.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{department.description}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                {memberCount > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {memberCount}
                  </span>
                )}
                {processCount > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {processCount}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onAddSub}
                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="Add sub-department"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal connector for children */}
        {hasChildren && isExpanded && (
          <div className="flex justify-center">
            <div className="relative">
              {/* Horizontal line spanning children */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-300" />
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="flex gap-8 pt-4 relative">
          {/* Horizontal line connecting all children */}
          <div className="absolute top-0 left-0 right-0 h-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-140px)] h-0.5 bg-gray-300" />
          </div>
          <div className="flex-1 grid grid-cols-1 gap-4 relative z-10">
            {department.children!.map((child) => (
              <DepartmentNodeWrapper
                key={child.id}
                department={child}
                depth={depth + 1}
                allDepartments={[]}
                onEdit={onEdit}
                onAddSub={onAddSub}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DepartmentNodeWrapper({
  department,
  depth,
  allDepartments,
  onEdit,
  onAddSub,
  onDelete,
}: {
  department: Department | DepartmentChild
  depth: number
  allDepartments: Department[]
  onEdit: (d: Department) => void
  onAddSub: (parentId: string) => void
  onDelete: (d: Department) => void
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0)

  // Get full department data with children
  const fullDepartment: Department = {
    id: department.id,
    name: department.name,
    description: department.description ?? null,
    parentId: department.parentId ?? null,
    children: allDepartments.filter((d) => d.parentId === department.id),
    _count: (department as Department)._count,
  }

  return (
    <DepartmentNode
      department={fullDepartment}
      depth={depth}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onEdit={() => onEdit(fullDepartment)}
      onAddSub={() => onAddSub(department.id)}
      onDelete={() => onDelete(fullDepartment)}
    />
  )
}

export default function OrgChart({
  departments,
  onEdit,
  onAddSub,
  onDelete,
}: OrgChartProps) {
  // Build hierarchy - find root departments (no parent)
  const rootDepartments = departments.filter((d) => !d.parentId)

  // For each root, we need to get all descendants
  const getDepartmentWithChildren = useCallback(
    (dept: Department): Department => ({
      ...dept,
      children: departments
        .filter((d) => d.parentId === dept.id)
        .map(getDepartmentWithChildren),
    }),
    [departments]
  )

  if (departments.length === 0) {
    return (
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No departments</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a department to your organization.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto py-8">
      <div className="flex flex-col items-center gap-8 min-w-max px-4">
        {rootDepartments.map((dept) => (
          <DepartmentNodeWrapper
            key={dept.id}
            department={dept}
            depth={0}
            allDepartments={departments}
            onEdit={onEdit}
            onAddSub={onAddSub}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
