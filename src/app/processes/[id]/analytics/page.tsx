"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

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

interface ProcessStep {
  id: string
  name: string
  description?: string
  completed: boolean
  completedAt?: string
  completedBy?: string
}

interface StepAnalytics {
  stepId: string
  name: string
  completed: boolean
  timeSpent?: number // in hours
  isBottleneck: boolean
}

interface ProcessAnalytics {
  totalSteps: number
  completedSteps: number
  completionPercentage: number
  averageTimePerStep?: number
  totalTime?: number
  bottlenecks: StepAnalytics[]
  stepDetails: StepAnalytics[]
}

export default function ProcessAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const processId = params.id as string

  const [process, setProcess] = useState<Process | null>(null)
  const [analytics, setAnalytics] = useState<ProcessAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
        calculateAnalytics(data.process)
      } else if (res.status === 401) {
        router.push("/auth/signin")
      } else if (res.status === 403 || res.status === 404) {
        router.push("/processes")
      } else {
        setError("Failed to load process")
      }
    } catch (err) {
      setError("An error occurred while loading process")
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (processData: Process) => {
    try {
      const parsedSteps: ProcessStep[] = JSON.parse(processData.steps || "[]")
      const processCreatedAt = new Date(processData.createdAt)

      const stepDetails: StepAnalytics[] = parsedSteps.map((step, index) => {
        const prevStep = index > 0 ? parsedSteps[index - 1] : null
        const startTime = prevStep?.completedAt ? new Date(prevStep.completedAt) : processCreatedAt
        const endTime = step.completedAt ? new Date(step.completedAt) : new Date()

        const timeSpent = step.completed ? (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) : undefined // hours

        return {
          stepId: step.id,
          name: step.name,
          completed: step.completed,
          timeSpent,
          isBottleneck: false, // will calculate below
        }
      })

      // Calculate bottlenecks (steps that take more than average time)
      const completedSteps = stepDetails.filter(s => s.completed && s.timeSpent !== undefined)
      const avgTime = completedSteps.length > 0
        ? completedSteps.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / completedSteps.length
        : 0

      const bottlenecks = stepDetails.map(step => ({
        ...step,
        isBottleneck: step.completed && step.timeSpent !== undefined && step.timeSpent > avgTime * 1.5
      }))

      const totalSteps = parsedSteps.length
      const completedStepsCount = parsedSteps.filter(s => s.completed).length
      const completionPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0

      const totalTime = completedSteps.length > 0
        ? completedSteps.reduce((sum, s) => sum + (s.timeSpent || 0), 0)
        : undefined

      const analytics: ProcessAnalytics = {
        totalSteps,
        completedSteps: completedStepsCount,
        completionPercentage,
        averageTimePerStep: completedSteps.length > 0 ? totalTime! / completedSteps.length : undefined,
        totalTime,
        bottlenecks: bottlenecks.filter(b => b.isBottleneck),
        stepDetails: bottlenecks,
      }

      setAnalytics(analytics)
    } catch (err) {
      setError("Failed to calculate analytics")
    }
  }

  const formatTime = (hours?: number) => {
    if (!hours) return "N/A"
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`
    return `${Math.round(hours / 24 * 10) / 10}d`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (error || !process || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load analytics"}</p>
          <Link
            href="/processes"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Processes
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
              <h1 className="text-3xl font-bold text-gray-900">Process Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Performance insights for: {process.name}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/processes/${process.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Process
              </Link>
              <Link
                href={`/processes/${process.id}/execute`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Execute Process
              </Link>
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completion</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.completionPercentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Steps Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.completedSteps}/{analytics.totalSteps}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Time/Step</p>
                <p className="text-2xl font-semibold text-gray-900">{formatTime(analytics.averageTimePerStep)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Time</p>
                <p className="text-2xl font-semibold text-gray-900">{formatTime(analytics.totalTime)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step Details */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Step Performance</h3>
            <p className="mt-1 text-sm text-gray-500">Detailed breakdown of each step's completion time</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Step
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bottleneck
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.stepDetails.map((step, index) => (
                  <tr key={step.stepId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{step.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        step.completed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {step.completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(step.timeSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {step.isBottleneck && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Bottleneck
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottlenecks Alert */}
        {analytics.bottlenecks.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Performance Bottlenecks Detected
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>The following steps are taking significantly longer than average:</p>
                  <ul className="mt-2 list-disc list-inside">
                    {analytics.bottlenecks.map((bottleneck) => (
                      <li key={bottleneck.stepId}>{bottleneck.name}</li>
                    ))}
                  </ul>
                  <p className="mt-2">Consider reviewing these steps for potential improvements or resource allocation.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Recommendations
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  {analytics.completionPercentage < 100 && (
                    <li>Complete remaining steps to improve overall process efficiency</li>
                  )}
                  {analytics.bottlenecks.length > 0 && (
                    <li>Review bottleneck steps for potential optimization opportunities</li>
                  )}
                  {analytics.averageTimePerStep && analytics.averageTimePerStep > 24 && (
                    <li>Consider breaking down long-running steps into smaller, manageable tasks</li>
                  )}
                  <li>Regular monitoring of process metrics can help identify trends and improvements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}