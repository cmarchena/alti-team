"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface ProcessStep {
  id: string
  name: string
  description?: string
  completed: boolean
  completedAt?: string
  completedBy?: string
}

interface Process {
  id: string
  name: string
  description: string | null
  steps: string
  createdAt: string
  department: {
    id: string
    name: string
  }
  organization: {
    id: string
    name: string
  }
}

export default function ProcessExecutionPage() {
  const router = useRouter()
  const params = useParams()
  const processId = params.id as string

  const [process, setProcess] = useState<Process | null>(null)
  const [steps, setSteps] = useState<ProcessStep[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (processId) {
      fetchProcess()
    }
  }, [processId])

  const fetchProcess = async () => {
    try {
      const res = await fetch(`/api/processes/${processId}`)
      if (res.ok) {
        const data = await res.json()
        setProcess(data.process)
        
        // Parse steps from JSON string
        try {
          const parsedSteps = JSON.parse(data.process.steps || "[]")
          // Ensure each step has required fields
          const normalizedSteps = parsedSteps.map((step: any, index: number) => ({
            id: step.id || `step-${index}`,
            name: step.name || `Step ${index + 1}`,
            description: step.description || "",
            completed: step.completed || false,
            completedAt: step.completedAt || null,
            completedBy: step.completedBy || null,
          }))
          setSteps(normalizedSteps)
        } catch (e) {
          setSteps([])
        }
      } else if (res.status === 401) {
        router.push("/auth/signin")
      } else if (res.status === 403 || res.status === 404) {
        router.push("/dashboard")
      } else {
        setError("Failed to load process")
      }
    } catch (err) {
      setError("An error occurred while loading process")
    } finally {
      setLoading(false)
    }
  }

  const toggleStep = async (stepId: string) => {
    const updatedSteps = steps.map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          completed: !step.completed,
          completedAt: !step.completed ? new Date().toISOString() : undefined,
        }
      }
      return step
    })
    
    setSteps(updatedSteps)
    await saveProgress(updatedSteps)
  }

  const saveProgress = async (updatedSteps: ProcessStep[]) => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/processes/${processId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: JSON.stringify(updatedSteps),
        }),
      })

      if (res.ok) {
        setSuccess("Progress saved")
        setTimeout(() => setSuccess(""), 2000)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to save progress")
      }
    } catch (err) {
      setError("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  const resetProgress = async () => {
    if (!confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      return
    }

    const resetSteps = steps.map((step) => ({
      ...step,
      completed: false,
      completedAt: undefined,
      completedBy: undefined,
    }))

    setSteps(resetSteps)
    await saveProgress(resetSteps)
  }

  const getCompletionPercentage = () => {
    if (steps.length === 0) return 0
    const completed = steps.filter((s) => s.completed).length
    return Math.round((completed / steps.length) * 100)
  }

  const getNextStep = () => {
    return steps.find((s) => !s.completed)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading process...</div>
      </div>
    )
  }

  if (!process) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Process not found</h2>
          <Link href="/dashboard" className="mt-4 text-indigo-600 hover:text-indigo-500">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const completionPercentage = getCompletionPercentage()
  const nextStep = getNextStep()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">{process.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {process.department.name} • {process.organization.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {saving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
              <button
                onClick={resetProgress}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Progress
              </button>
            </div>
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

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Progress</h2>
            <span className="text-2xl font-bold text-indigo-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{steps.filter((s) => s.completed).length} of {steps.length} steps completed</span>
            {nextStep && (
              <span>Next: {nextStep.name}</span>
            )}
            {completionPercentage === 100 && (
              <span className="text-green-600 font-medium">✓ Process Complete!</span>
            )}
          </div>
        </div>

        {/* Process Description */}
        {process.description && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600">{process.description}</p>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Steps</h2>
          </div>
          
          {steps.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No steps defined for this process.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  className={`p-6 ${step.completed ? "bg-green-50" : ""}`}
                >
                  <div className="flex items-start">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center mr-4 mt-0.5 ${
                        step.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-indigo-500"
                      }`}
                    >
                      {step.completed && (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`text-sm font-medium ${
                            step.completed ? "text-green-800 line-through" : "text-gray-900"
                          }`}
                        >
                          <span className="text-gray-400 mr-2">#{index + 1}</span>
                          {step.name}
                        </h3>
                        {step.completed && step.completedAt && (
                          <span className="text-xs text-gray-500">
                            Completed {new Date(step.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {step.description && (
                        <p
                          className={`mt-1 text-sm ${
                            step.completed ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Completion Message */}
        {completionPercentage === 100 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-green-800">
              Process Completed Successfully!
            </h3>
            <p className="mt-2 text-sm text-green-600">
              All steps have been completed. You can reset the progress to run this process again.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
