import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrganizationRepository, getProjectRepository, getTaskRepository, getTeamMemberRepository } from '@/lib/repositories'
import { isSuccess } from '@/lib/result'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: Message[]
  stream?: boolean
  conversationId?: string
}

// Task-related query patterns
const TASK_QUERY_PATTERNS = [
  /show.*tasks?/i,
  /my tasks/i,
  /list.*tasks?/i,
  /get.*tasks?/i,
  /view.*tasks?/i,
  /what.*tasks?/i,
  /tasks?.*due/i,
  /pending.*tasks?/i,
  /^\/tasks\s*$/i,  // Explicitly match /tasks with optional trailing whitespace
  /^\/tasks$/i,     // Also match /tasks without trailing whitespace
]

// Project-related query patterns
const PROJECT_QUERY_PATTERNS = [
  /show.*projects?/i,
  /my projects?/i,
  /list.*projects?/i,
  /get.*projects?/i,
  /view.*projects?/i,
  /what.*projects?/i,
  /\/projects\b/i,
]

// Organization-related query patterns
const ORG_QUERY_PATTERNS = [
  /show.*organizations?/i,
  /my organizations?/i,
  /list.*organizations?/i,
  /get.*organizations?/i,
  /view.*organizations?/i,
  /what.*organizations?/i,
  /\/organizations\b/i,
  /list my org/i,
  /my orgs?/i,
]

// Check if a message is a task-related query
function isTaskQuery(content: string): boolean {
  // Direct slash command match - must be first and most specific
  if (content.trim() === '/tasks') {
    return true
  }
  
  return TASK_QUERY_PATTERNS.some(pattern => pattern.test(content))
}

// Check if a message is a project-related query
function isProjectQuery(content: string): boolean {
  // Direct slash command match - must be first and most specific
  if (content.trim() === '/projects') {
    return true
  }
  
  return PROJECT_QUERY_PATTERNS.some(pattern => pattern.test(content))
}

// Check if a message is an organization-related query
function isOrgQuery(content: string): boolean {
  return ORG_QUERY_PATTERNS.some(pattern => pattern.test(content))
}

// Fetch user's organizations with proper markdown formatting
async function fetchUserOrganizations(userId: string): Promise<string> {
  const orgRepo = getOrganizationRepository()

  // Get organizations the user belongs to
  const orgsResult = await orgRepo.findByOwnerId(userId)
  if (!isSuccess(orgsResult) || orgsResult.data.length === 0) {
    return '**No organizations found.**\n\nYou do not belong to any organizations yet.'
  }

  const organizations = orgsResult.data

  // Format the response with proper markdown
  let response = `## Your Organizations (${organizations.length} total)\n\n`

  for (const org of organizations) {
    response += `#### \`${org.name}\` (ID: ${org.id})\n`
    response += `- **Created:** ${new Date(org.createdAt).toLocaleDateString()}\n`
    response += '\n'
  }

  response += '---\n**Quick Actions:**\n'
  response += '- View details of an organization?\n'
  response += '- Switch focus to a different org?\n'
  response += '- Create a new organization?\n'
  response += '- Manage teams or projects within an org?\n'

  return response
}

// Fetch user's tasks across all their organizations/projects
async function fetchUserTasks(userId: string): Promise<string> {
  const orgRepo = getOrganizationRepository()
  const projectRepo = getProjectRepository()
  const taskRepo = getTaskRepository()

  // Get organizations owned by the user
  const orgsResult = await orgRepo.findByOwnerId(userId)
  if (!isSuccess(orgsResult) || orgsResult.data.length === 0) {
    return '**No organizations found.**\n\nYou do not have any organizations yet.'
  }

  const allTasks: Array<{
    title: string
    status: string
    priority: string
    dueDate?: Date
    projectName: string
    orgName: string
  }> = []

  for (const org of orgsResult.data) {
    // Get projects in this organization
    const projectsResult = await projectRepo.findByOrganizationId(org.id)
    if (!isSuccess(projectsResult)) continue

    for (const project of projectsResult.data) {
      // Get tasks for this project
      const tasksResult = await taskRepo.findByProjectId(project.id)
      if (!isSuccess(tasksResult)) continue

      for (const task of tasksResult.data) {
        allTasks.push({
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          projectName: project.name,
          orgName: org.name,
        })
      }
    }
  }

  if (allTasks.length === 0) {
    return '**No tasks found.**\n\nYou do not have any tasks yet.'
  }

  // Format the response with richer markdown
  let response = `## Your Tasks (${allTasks.length} total)\n\n`

  // Group by status
  const byStatus: Record<string, typeof allTasks> = {}
  for (const task of allTasks) {
    if (!byStatus[task.status]) byStatus[task.status] = []
    byStatus[task.status].push(task)
  }

  const statusLabels: Record<string, string> = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'In Review',
    'done': 'Completed',
  }

  for (const [status, tasks] of Object.entries(byStatus)) {
    const label = statusLabels[status] || status
    response += `#### ${label} (${tasks.length})\n`
    for (const task of tasks) {
      const dueStr = task.dueDate
        ? ` (due: ${new Date(task.dueDate).toLocaleDateString()})`
        : ''
      const priorityEmoji = {
        'low': '[Low]',
        'medium': '[Medium]',
        'high': '[High]',
        'urgent': '[Urgent]',
      }[task.priority] || ''
      response += `- ${priorityEmoji} **${task.title}** in ${task.projectName}${dueStr}\n`
    }
    response += '\n'
  }

  response += '---\n**Quick Actions:**\n'
  response += '- View details on a specific task?\n'
  response += '- Create a new task?\n'
  response += '- Filter tasks by priority or status?\n'

  return response
}

// Fetch user's projects across all their organizations
async function fetchUserProjects(userId: string): Promise<string> {
  const orgRepo = getOrganizationRepository()
  const projectRepo = getProjectRepository()

  // Get organizations owned by the user
  const orgsResult = await orgRepo.findByOwnerId(userId)
  if (!isSuccess(orgsResult) || orgsResult.data.length === 0) {
    return 'You do not have any organizations yet.'
  }

  interface ProjectItem {
    id: string
    name: string
    description?: string
    status: string
  }

  const projects: ProjectItem[] = []

  for (const org of orgsResult.data) {
    // Get projects in this organization
    const projectsResult = await projectRepo.findByOrganizationId(org.id)
    if (!isSuccess(projectsResult)) continue

    for (const project of projectsResult.data) {
      projects.push({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
      })
    }
  }

  if (projects.length === 0) {
    return '**No projects found.**\n\nYou do not have any projects yet.'
  }

  // Format the response with richer markdown
  let response = `## Your Projects (${projects.length} total)\n\n`

  for (const project of projects) {
    const statusLabel = project.status
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())

    response += `#### ${project.name} (ID: ${project.id})\n`
    response += `- **Status:** ${statusLabel}\n`
    if (project.description) {
      response += `- **Description:** ${project.description}\n`
    }
    response += '\n'
  }

  response += '---\n**Quick Actions:**\n'
  response += '- Get details on a specific project?\n'
  response += '- Create a new project?\n'
  response += '- Manage tasks for one of these?\n'
  response += '- Create a new project?\n'
  response += '- Manage tasks for one of these?\n'

  return response
}

async function callOpenRouter(
  messages: Message[],
  tools: any[],
  stream: boolean = false,
): Promise<ReadableStream | { content: string; tool_calls: any[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AltiTeam',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${error}`)
  }

  if (stream) {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    return new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content =
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.choices?.[0]?.message?.content ||
                  ''
                if (content) {
                  controller.enqueue(encoder.encode(content))
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }
        }

        controller.close()
      },
    })
  }

  const result = await response.json()

  return {
    content: result.choices?.[0]?.message?.content || '',
    tool_calls: result.choices?.[0]?.message?.tool_calls || [],
  }
}

async function processStreamingMessage(
  messages: Message[],
): Promise<ReadableStream> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const tools: any[] = []

        const stream = (await callOpenRouter(
          messages,
          tools,
          true,
        )) as ReadableStream

        const reader = stream.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }

        controller.close()
      } catch (error) {
        console.error('Stream error:', error)
        controller.error(error)
      }
    },
  })
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ChatRequest = await request.json()
    const { messages, stream = false } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 },
      )
    }

    // Check if the latest user message is a task, project, or org query
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    const shouldFetchTasks = lastUserMessage && isTaskQuery(lastUserMessage.content)
    const shouldFetchProjects = lastUserMessage && isProjectQuery(lastUserMessage.content)
    const shouldFetchOrgs = lastUserMessage && isOrgQuery(lastUserMessage.content)

    if (shouldFetchTasks && !stream) {
      // For non-streaming, return tasks as text
      const tasksResponse = await fetchUserTasks(session.user.id)
      return NextResponse.json({ message: tasksResponse })
    }

    if (shouldFetchTasks && stream) {
      // For streaming, create a stream that returns the tasks text
      const tasksResponse = await fetchUserTasks(session.user.id)
      const encoder = new TextEncoder()

      const readableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(tasksResponse))
          controller.close()
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    if (shouldFetchOrgs && !stream) {
      // For non-streaming, return organizations as text
      const orgsResponse = await fetchUserOrganizations(session.user.id)
      return NextResponse.json({ message: orgsResponse })
    }

    if (shouldFetchOrgs && stream) {
      // For streaming, create a stream that returns the organizations text
      const orgsResponse = await fetchUserOrganizations(session.user.id)
      const encoder = new TextEncoder()

      const readableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(orgsResponse))
          controller.close()
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    if (shouldFetchProjects && !stream) {
      // For non-streaming, return projects as text
      const projectsResponse = await fetchUserProjects(session.user.id)
      return NextResponse.json({ message: projectsResponse })
    }

    if (shouldFetchProjects && stream) {
      // For streaming, create a stream that returns the projects text
      const projectsResponse = await fetchUserProjects(session.user.id)
      const encoder = new TextEncoder()

      const readableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(projectsResponse))
          controller.close()
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 },
      )
    }

    if (stream) {
      const readableStream = await processStreamingMessage(messages)

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    const result = (await callOpenRouter(messages, [], false)) as {
      content: string
    }

    return NextResponse.json({ message: result.content })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 },
    )
  }
}
