import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getOrganizationRepository,
  getProjectRepository,
  getTaskRepository,
  getTeamMemberRepository,
} from '@/lib/repositories'
import { isSuccess, isFailure } from '@/lib/result'

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
  /^\/tasks\s*$/i, // Explicitly match /tasks with optional trailing whitespace
  /^\/tasks$/i, // Also match /tasks without trailing whitespace
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

// Task creation patterns
const TASK_CREATE_PATTERNS = [
  /create.*task/i,
  /new.*task/i,
  /add.*task/i,
  /make.*task/i,
  /\/create\s*task/i,
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

  return TASK_QUERY_PATTERNS.some((pattern) => pattern.test(content))
}

// Check if a message is a project-related query
function isProjectQuery(content: string): boolean {
  // Direct slash command match - must be first and most specific
  if (content.trim() === '/projects') {
    return true
  }

  return PROJECT_QUERY_PATTERNS.some((pattern) => pattern.test(content))
}

// Check if a message is an organization-related query
function isOrgQuery(content: string): boolean {
  return ORG_QUERY_PATTERNS.some((pattern) => pattern.test(content))
}

// Check if a message is a task creation request
function isTaskCreateQuery(content: string): boolean {
  return TASK_CREATE_PATTERNS.some((pattern) => pattern.test(content))
}

// Fetch user's projects for task creation
async function fetchUserProjectsSimple(
  userId: string,
): Promise<Array<{ id: string; name: string }>> {
  const orgRepo = getOrganizationRepository()
  const projectRepo = getProjectRepository()
  const teamMemberRepo = getTeamMemberRepository()

  // Get organizations from both sources
  const ownedOrgsResult = await orgRepo.findByOwnerId(userId)
  const memberOrgsResult = await teamMemberRepo.findByUserId(userId)

  // Deduplicate using Map (owner takes priority)
  const orgMap = new Map<string, boolean>()

  if (isSuccess(ownedOrgsResult)) {
    for (const org of ownedOrgsResult.data) {
      orgMap.set(org.id, true)
    }
  }

  if (isSuccess(memberOrgsResult)) {
    for (const membership of memberOrgsResult.data) {
      if (orgMap.has(membership.organizationId)) continue
      orgMap.set(membership.organizationId, true)
    }
  }

  const projects: Array<{ id: string; name: string }> = []

  for (const orgId of Array.from(orgMap.keys())) {
    const projectsResult = await projectRepo.findByOrganizationId(orgId)
    if (!isSuccess(projectsResult)) continue

    for (const project of projectsResult.data) {
      projects.push({
        id: project.id,
        name: project.name,
      })
    }
  }

  return projects
}

// Create a task via API
async function createTaskViaAPI(
  userId: string,
  title: string,
  projectId: string,
  description?: string,
  priority?: string,
  dueDate?: string,
): Promise<{ success: boolean; task?: any; error?: string }> {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/tasks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await generateToken(userId)}`,
      },
      body: JSON.stringify({
        title,
        projectId,
        description,
        priority: priority || 'medium',
        dueDate,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    return { success: false, error: error.error || 'Failed to create task' }
  }

  const data = await response.json()
  return { success: true, task: data.task }
}

// Generate a JWT token for API calls
async function generateToken(userId: string): Promise<string> {
  const jwt = await import('jsonwebtoken')
  const secret =
    process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'
  return jwt.default.sign({ sub: userId }, secret, { expiresIn: '1h' })
}

// Create a project via API
async function createProjectViaAPI(
  userId: string,
  name: string,
  organizationId: string,
  description?: string,
): Promise<{ success: boolean; project?: any; error?: string }> {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/projects`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await generateToken(userId)}`,
      },
      body: JSON.stringify({
        name,
        organizationId,
        description,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    return { success: false, error: error.error || 'Failed to create project' }
  }

  const data = await response.json()
  return { success: true, project: data.project }
}

// Tool definitions for OpenRouter
const CHAT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_organization',
      description: 'Create a new organization',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Organization name',
          },
          description: {
            type: 'string',
            description: 'Organization description (optional)',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_my_organizations',
      description: 'List all organizations the current user belongs to',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_user_projects',
      description: 'List all projects the user has access to',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Create a new project in an organization',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Project name',
          },
          description: {
            type: 'string',
            description: 'Project description (optional)',
          },
          organizationId: {
            type: 'string',
            description: 'Organization ID (use organizationName instead)',
          },
          organizationName: {
            type: 'string',
            description:
              'Organization name (alternative to organizationId, case-insensitive)',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task in a project',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Task title/name',
          },
          description: {
            type: 'string',
            description: 'Task description (optional)',
          },
          projectId: {
            type: 'string',
            description:
              'Project ID (use projectName instead if you know the name)',
          },
          projectName: {
            type: 'string',
            description:
              'Project name (alternative to projectId, case-insensitive)',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Task priority',
          },
          dueDate: {
            type: 'string',
            description: 'Due date in YYYY-MM-DD format (optional)',
          },
        },
        required: ['title'],
      },
    },
  },
]

// Handle tool calls from the LLM
async function handleToolCalls(
  toolCalls: any[],
  userId: string,
): Promise<Array<{ tool: string; result: any }>> {
  const results: Array<{ tool: string; result: any }> = []

  for (const toolCall of toolCalls) {
    const { function: fn } = toolCall
    const args = JSON.parse(fn.arguments || '{}')

    console.log('Tool call:', fn.name, args)

    switch (fn.name) {
      case 'create_organization': {
        const { name, description } = args

        if (!name) {
          results.push({
            tool: 'create_organization',
            result: {
              success: false,
              error: 'Missing required field: name',
            },
          })
          break
        }

        const orgRepo = getOrganizationRepository()
        const teamMemberRepo = getTeamMemberRepository()

        // Create the organization
        const createResult = await orgRepo.create({
          name,
          description: description || '',
          ownerId: userId,
        })

        if (isFailure(createResult)) {
          results.push({
            tool: 'create_organization',
            result: {
              success: false,
              error: createResult.error.message,
            },
          })
          break
        }

        const organization = createResult.data

        // Create team member entry for the owner
        await teamMemberRepo.create({
          userId,
          organizationId: organization.id,
          role: 'ADMIN',
          position: 'Owner',
        })

        results.push({
          tool: 'create_organization',
          result: {
            success: true,
            organization,
            message: `Organization "${name}" created successfully with ID: ${organization.id}`,
          },
        })
        break
      }

      case 'list_my_organizations': {
        const orgRepo = getOrganizationRepository()
        const teamMemberRepo = getTeamMemberRepository()

        // Find organizations where user is owner
        const ownedOrgsResult = await orgRepo.findByOwnerId(userId)

        // Find organizations where user is a member
        const memberOrgsResult = await teamMemberRepo.findByUserId(userId)

        // Deduplicate using Map (owner takes priority)
        const orgMap = new Map<string, any>()

        if (isSuccess(ownedOrgsResult)) {
          for (const org of ownedOrgsResult.data) {
            orgMap.set(org.id, { ...org, role: 'owner' })
          }
        }

        if (isSuccess(memberOrgsResult)) {
          for (const membership of memberOrgsResult.data) {
            if (orgMap.has(membership.organizationId)) continue // Skip if already owner
            const orgResult = await orgRepo.findById(membership.organizationId)
            if (isSuccess(orgResult) && orgResult.data) {
              orgMap.set(membership.organizationId, {
                ...orgResult.data,
                role: membership.role,
              })
            }
          }
        }

        const organizations = Array.from(orgMap.values())
        const orgList = organizations
          .map((o) => `- ${o.name} (ID: ${o.id})`)
          .join('\n')

        results.push({
          tool: 'list_my_organizations',
          result: {
            organizations,
            message: `Your Organizations (${organizations.length} total):\n${orgList}`,
          },
        })
        break
      }

      case 'list_user_projects': {
        const projects = await fetchUserProjectsSimple(userId)
        const projectList = projects
          .map((p) => `- ID: ${p.id}, Name: "${p.name}"`)
          .join('\n')
        results.push({
          tool: 'list_user_projects',
          result: {
            projects,
            message: `Available projects:\n${projectList}\n\nUse the project ID from above when calling create_task.`,
          },
        })
        break
      }

      case 'create_project': {
        const { name, description, organizationId, organizationName } = args

        console.log('Creating project:', {
          name,
          description,
          organizationId,
          organizationName,
        })

        if (!name) {
          results.push({
            tool: 'create_project',
            result: {
              success: false,
              error: 'Missing required field: name',
            },
          })
          break
        }

        let orgId = organizationId

        if (!orgId && organizationName) {
          const orgRepo = getOrganizationRepository()
          const orgsResult = await orgRepo.findByOwnerId(userId)
          if (isSuccess(orgsResult)) {
            const matching = orgsResult.data.find(
              (o) => o.name.toLowerCase() === organizationName.toLowerCase(),
            )
            if (matching) {
              orgId = matching.id
            }
          }
        }

        if (!orgId) {
          results.push({
            tool: 'create_project',
            result: {
              success: false,
              error:
                'Organization not found. Please specify a valid organization.',
            },
          })
          break
        }

        const createResult = await createProjectViaAPI(
          userId,
          name,
          orgId,
          description,
        )

        console.log('Project creation result:', createResult)

        if (createResult.success) {
          results.push({
            tool: 'create_project',
            result: {
              success: true,
              project: createResult.project,
              message: `Project "${name}" created successfully with ID: ${createResult.project.id}`,
            },
          })
        } else {
          results.push({
            tool: 'create_project',
            result: {
              success: false,
              error: createResult.error,
            },
          })
        }
        break
      }

      case 'create_task': {
        let { title, description, projectId, projectName, priority, dueDate } =
          args

        console.log('Creating task:', {
          title,
          description,
          projectId,
          projectName,
          priority,
          dueDate,
        })

        if (!title) {
          results.push({
            tool: 'create_task',
            result: {
              success: false,
              error: `Missing required field: title=${title}`,
            },
          })
          break
        }

        if (!projectId && projectName) {
          const projects = await fetchUserProjectsSimple(userId)
          const matching = projects.find(
            (p) => p.name.toLowerCase() === projectName.toLowerCase(),
          )
          if (matching) {
            projectId = matching.id
          }
        }

        if (!projectId) {
          results.push({
            tool: 'create_task',
            result: {
              success: false,
              error: `Missing projectId. Available projects: ${(
                await fetchUserProjectsSimple(userId)
              )
                .map((p) => `${p.id} (${p.name})`)
                .join(', ')}`,
            },
          })
          break
        }

        const createResult = await createTaskViaAPI(
          userId,
          title,
          projectId,
          description,
          priority,
          dueDate,
        )

        console.log('Task creation result:', createResult)

        if (createResult.success) {
          results.push({
            tool: 'create_task',
            result: {
              success: true,
              task: createResult.task,
              message: `Task "${title}" created successfully with ID: ${createResult.task.id}`,
            },
          })
        } else {
          const errorMsg = createResult.error || 'Unknown error occurred'
          console.log('Task creation error:', errorMsg)
          let userMessage = `Error: ${errorMsg}`

          if (
            errorMsg.includes('Organization not found') ||
            errorMsg.includes('Access denied')
          ) {
            userMessage = `Error: The project "${projectName || projectId}" is not associated with your organization.\n\nTo create tasks, use the website UI at /tasks/new and select a project from your organization.`
          }

          results.push({
            tool: 'create_task',
            result: {
              success: false,
              error: userMessage,
            },
          })
        }
        break
      }

      default:
        results.push({
          tool: fn.name,
          result: { error: `Unknown tool: ${fn.name}` },
        })
    }
  }

  return results
}

// Fetch user's organizations with proper markdown formatting
async function fetchUserOrganizations(userId: string): Promise<string> {
  const orgRepo = getOrganizationRepository()
  const teamMemberRepo = getTeamMemberRepository()

  // Get organizations from both sources
  const ownedOrgsResult = await orgRepo.findByOwnerId(userId)
  const memberOrgsResult = await teamMemberRepo.findByUserId(userId)

  // Deduplicate using Map (owner takes priority)
  const orgMap = new Map<string, any>()

  if (isSuccess(ownedOrgsResult)) {
    for (const org of ownedOrgsResult.data) {
      orgMap.set(org.id, { ...org, role: 'owner' })
    }
  }

  if (isSuccess(memberOrgsResult)) {
    for (const membership of memberOrgsResult.data) {
      if (orgMap.has(membership.organizationId)) continue // Skip if already owner
      const orgResult = await orgRepo.findById(membership.organizationId)
      if (isSuccess(orgResult) && orgResult.data) {
        orgMap.set(membership.organizationId, {
          ...orgResult.data,
          role: membership.role,
        })
      }
    }
  }

  const organizations = Array.from(orgMap.values())

  if (organizations.length === 0) {
    return '**No organizations found.**\n\nYou do not belong to any organizations yet.'
  }

  // Format the response with proper markdown
  let response = `## Your Organizations (${organizations.length} total)\n\n`

  for (const org of organizations) {
    response += `#### \`${org.name}\` (ID: ${org.id})\n`
    response += `- **Created:** ${new Date(org.createdAt).toLocaleDateString()}\n`
    response +=
      '- **Role:** ' + (org.role === 'owner' ? 'Owner' : org.role) + '\n'
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
    todo: 'To Do',
    'in-progress': 'In Progress',
    review: 'In Review',
    done: 'Completed',
  }

  for (const [status, tasks] of Object.entries(byStatus)) {
    const label = statusLabels[status] || status
    response += `#### ${label} (${tasks.length})\n`
    for (const task of tasks) {
      const dueStr = task.dueDate
        ? ` (due: ${new Date(task.dueDate).toLocaleDateString()})`
        : ''
      const priorityEmoji =
        {
          low: '[Low]',
          medium: '[Medium]',
          high: '[High]',
          urgent: '[Urgent]',
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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const requestBody: any = {
      model: 'openrouter/free',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream,
    }

    if (tools.length > 0) {
      requestBody.tools = tools
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
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      },
    )

    clearTimeout(timeout)

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
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenRouter request timed out after 30s')
    }
    throw error
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

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()
    const shouldFetchTasks =
      lastUserMessage && isTaskQuery(lastUserMessage.content)
    const shouldFetchProjects =
      lastUserMessage && isProjectQuery(lastUserMessage.content)
    const shouldFetchOrgs =
      lastUserMessage && isOrgQuery(lastUserMessage.content)
    const shouldCreateTask =
      lastUserMessage && isTaskCreateQuery(lastUserMessage.content)

    if (shouldFetchTasks && !stream) {
      const tasksResponse = await fetchUserTasks(session.user.id)
      return NextResponse.json({ message: tasksResponse })
    }

    if (shouldFetchTasks && stream) {
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
          Connection: 'keep-alive',
        },
      })
    }

    if (shouldFetchOrgs && !stream) {
      const orgsResponse = await fetchUserOrganizations(session.user.id)
      return NextResponse.json({ message: orgsResponse })
    }

    if (shouldFetchOrgs && stream) {
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
          Connection: 'keep-alive',
        },
      })
    }

    if (shouldFetchProjects && !stream) {
      const projectsResponse = await fetchUserProjects(session.user.id)
      return NextResponse.json({ message: projectsResponse })
    }

    if (shouldFetchProjects && stream) {
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
          Connection: 'keep-alive',
        },
      })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 },
      )
    }

    const tools = shouldCreateTask ? CHAT_TOOLS : []

    if (stream) {
      const encoder = new TextEncoder()

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const result = (await callOpenRouter(messages, tools, false)) as {
              content: string
              tool_calls: any[]
            }

            if (result.tool_calls && result.tool_calls.length > 0) {
              const toolResults = await handleToolCalls(
                result.tool_calls,
                session.user.id,
              )

              let toolResponseText = 'Task creation results:\n\n'
              for (const { tool, result: toolResult } of toolResults) {
                if (toolResult.success) {
                  toolResponseText += `✓ ${toolResult.message}\n`
                } else {
                  toolResponseText += `✗ Error: ${toolResult.error}\n`
                }
              }

              controller.enqueue(encoder.encode(toolResponseText))
            } else {
              controller.enqueue(encoder.encode(result.content))
            }

            controller.close()
          } catch (error) {
            console.error('Stream error:', error)
            controller.error(error)
          }
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    const result = (await callOpenRouter(messages, tools, false)) as {
      content: string
      tool_calls: any[]
    }

    if (result.tool_calls && result.tool_calls.length > 0) {
      const toolResults = await handleToolCalls(
        result.tool_calls,
        session.user.id,
      )

      let toolResponseText = 'Task creation results:\n\n'
      for (const { tool, result: toolResult } of toolResults) {
        if (toolResult.success) {
          toolResponseText += `✓ ${toolResult.message}\n`
        } else {
          toolResponseText += `✗ Error: ${toolResult.error}\n`
        }
      }

      return NextResponse.json({
        message: result.content + '\n\n' + toolResponseText,
        tool_results: toolResults,
      })
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
