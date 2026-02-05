'use client'

import { useState } from 'react'

interface WorkflowData {
  name?: string
  description?: string
  assigneeId?: string
  dueDate?: string
  [key: string]: unknown
}

interface WorkflowConfirmationProps {
  entityType: string
  data: WorkflowData
  onConfirm: () => void
  onCancel: () => void
  onBack: () => void
  isLoading?: boolean
}

export default function WorkflowConfirmation({
  entityType,
  data,
  onConfirm,
  onCancel,
  onBack,
  isLoading = false,
}: WorkflowConfirmationProps) {
  const [confirmed, setConfirmed] = useState(false)

  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim()
  }

  const formatValue = (value: unknown): string => {
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }
    if (typeof value === 'string') {
      return value
    }
    return String(value)
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 my-4">
      <div className="flex items-center gap-2 mb-3">
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <h3 className="font-semibold text-indigo-900">
          Confirm {entityType.charAt(0).toUpperCase() + entityType.slice(1)}{' '}
          Creation
        </h3>
      </div>

      <div className="space-y-2 mb-4">
        {Object.entries(data).map(([key, value]) => {
          if (!value || key.startsWith('_')) return null
          return (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-indigo-700">{formatKey(key)}:</span>
              <span className="font-medium text-indigo-900">
                {formatValue(value)}
              </span>
            </div>
          )
        })}
      </div>

      {!confirmed ? (
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmed(true)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? 'Creating...' : 'Confirm'}
          </button>
          <button
            onClick={onBack}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-indigo-700 mb-2">
            Are you sure you want to proceed?
          </div>
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Yes, Create'
              )}
            </button>
            <button
              onClick={() => setConfirmed(false)}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              No, Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
