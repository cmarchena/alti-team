import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { getMCPTools, callMCPTool, closeMCPClient } from '@/lib/mcp/client'
import {
  WorkflowState,
  createWorkflowState,
  getNextStep,
  getStepLabel,
  getStepPrompt,
  isConfirmationStep,
  formatWorkflowState,
  mergeWorkflowData,
  WorkflowData,
} from '@/lib/chat/workflow-types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: Message[]
  stream?: boolean
  conversationId?: string
}

interface WorkflowContext {
  workflows: Map<string, WorkflowState>
}

const workflowContext: WorkflowContext = {
  workflows: new Map(),
}

function getWorkflow(conversationId: string): WorkflowState | null {
  return workflowContext.workflows.get(conversationId) || null
}

function setWorkflow(conversationId: string, state: WorkflowState): void {
  workflowContext.workflows.set(conversationId, state)
}

function clearWorkflow(conversationId: string): void {
  workflowContext.workflows.delete(conversationId)
}

function isWorkflowCommand(
  content: string,
): { command: string; args?: string } | null {
  const lower = content.toLowerCase().trim()

  if (lower === 'yes' || lower === 'confirm' || lower === 'y') {
    return { command: 'confirm' }
  }
  if (lower === 'no' || lower === 'cancel' || lower === 'n') {
    return { command: 'cancel' }
  }
  if (lower === 'back' || lower === 'go back') {
    return { command: 'back' }
  }
  if (lower === 'skip') {
    return { command: 'skip' }
  }

  return null
}

function extractEntityTypeFromContent(content: string): string | null {
  const lower = content.toLowerCase()

  if (lower.includes('project')) return 'project'
  if (lower.includes('task')) return 'task'
  if (lower.includes('team')) return 'team'
  if (lower.includes('department')) return 'department'
  if (lower.includes('organization')) return 'organization'
  if (lower.includes('member')) return 'member'
  if (lower.includes('invite')) return 'invitation'

  return null
}

function extractActionFromContent(content: string): string | null {
  const lower = content.toLowerCase()

  if (
    lower.includes('create') ||
    lower.includes('new') ||
    lower.includes('add')
  ) {
    return 'create'
  }
  if (
    lower.includes('update') ||
    lower.includes('edit') ||
    lower.includes('modify')
  ) {
    return 'update'
  }
  if (lower.includes('delete') || lower.includes('remove')) {
    return 'delete'
  }

  return null
}

async function handleWorkflowStep(
  message: string,
  workflow: WorkflowState,
  sessionUserId: string,
): Promise<{ response: string; updatedWorkflow: WorkflowState | null }> {
  const command = isWorkflowCommand(message)

  if (command?.command === 'cancel') {
    clearWorkflow(workflow.id)
    return {
      response: 'Workflow cancelled. How else can I help you?',
      updatedWorkflow: null,
    }
  }

  if (command?.command === 'back' && workflow.currentStep !== 'init') {
    const steps = workflow.data.entityType
      ? (workflow.data.entityType as string)
      : 'project'
    const allSteps = getStepLabel(steps as any).split(' ')
    workflow.currentStep = 'init' as any
    workflow.status = 'collecting'
    return {
      response: `Let's start over. ${getStepPrompt('init', steps)}`,
      updatedWorkflow: workflow,
    }
  }

  if (command?.command === 'skip') {
    const nextStep = getNextStep(workflow.currentStep, workflow.entityType)
    workflow.currentStep = nextStep
    workflow.status = nextStep === 'executing' ? 'executing' : 'collecting'

    if (isConfirmationStep(nextStep)) {
      return {
        response: `${getStepPrompt(nextStep, workflow.entityType)}\n\nHere are the details:\n${formatWorkflowData(workflow.data)}`,
        updatedWorkflow: workflow,
      }
    }

    return {
      response: getStepPrompt(nextStep, workflow.entityType),
      updatedWorkflow: workflow,
    }
  }

  if (isConfirmationStep(workflow.currentStep)) {
    if (command?.command !== 'confirm') {
      return {
        response: 'Please answer with "yes" to confirm or "no" to cancel.',
        updatedWorkflow: workflow,
      }
    }

    workflow.currentStep = 'executing'
    workflow.status = 'executing'

    return {
      response: await executeWorkflowAction(workflow, sessionUserId),
      updatedWorkflow: workflow,
    }
  }

  const fieldName = getFieldForStep(workflow.currentStep)
  if (fieldName) {
    workflow.data.stepData = mergeWorkflowData(
      workflow.data.stepData as Record<string, unknown>,
      { [fieldName]: message },
    )
  }

  const nextStep = getNextStep(workflow.currentStep, workflow.entityType)
  workflow.currentStep = nextStep
  workflow.status = nextStep === 'executing' ? 'executing' : 'collecting'

  if (isConfirmationStep(nextStep)) {
    return {
      response: `${getStepPrompt(nextStep, workflow.entityType)}\n\nHere are the details:\n${formatWorkflowData(workflow.data)}`,
      updatedWorkflow: workflow,
    }
  }

  return {
    response: getStepPrompt(nextStep, workflow.entityType),
    updatedWorkflow: workflow,
  }
}

function formatWorkflowData(data: WorkflowData): string {
  const stepData = data.stepData as Record<string, unknown>
  if (!stepData || Object.keys(stepData).length === 0) {
    return 'No data collected yet.'
  }

  return Object.entries(stepData)
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
      return `- **${label}**: ${value}`
    })
    .join('\n')
}

function getFieldForStep(step: string): string | null {
  const fieldMap: Record<string, string> = {
    collect_name: 'name',
    collect_description: 'description',
    collect_assignee: 'assigneeId',
    collect_date: 'dueDate',
  }
  return fieldMap[step] || null
}

async function executeWorkflowAction(
  workflow: WorkflowState,
  userId: string,
): Promise<string> {
  const { entityType, action, data } = workflow
  const stepData = data.stepData as Record<string, unknown>

  try {
    let toolName = ''
    const toolArgs: Record<string, unknown> = {}

    switch (entityType) {
      case 'project':
        toolName = 'create_project'
        toolArgs.name = stepData.name
        if (stepData.description) toolArgs.description = stepData.description
        break
      case 'task':
        toolName = 'create_task'
        toolArgs.title = stepData.name
        if (stepData.description) toolArgs.description = stepData.description
        if (stepData.assigneeId) toolArgs.assigneeId = stepData.assigneeId
        if (stepData.dueDate) toolArgs.dueDate = stepData.dueDate
        break
      case 'team':
        toolName = 'create_team'
        toolArgs.name = stepData.name
        if (stepData.description) toolArgs.description = stepData.description
        break
      case 'department':
        toolName = 'create_department'
        toolArgs.name = stepData.name
        if (stepData.description) toolArgs.description = stepData.description
        break
      case 'organization':
        toolName = 'create_organization'
        toolArgs.name = stepData.name
        if (stepData.description) toolArgs.description = stepData.description
        break
      default:
        return 'I apologize, but I cannot execute this type of workflow yet.'
    }

    const result = await callMCPTool(toolName, toolArgs)

    const textContent = result.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text || '')
      .join('\n')

    clearWorkflow(workflow.id)

    return `Successfully created ${entityType}!\n\n${textContent}\n\nIs there anything else I can help you with?`
  } catch (error) {
    clearWorkflow(workflow.id)
    return `I encountered an error while creating the ${entityType}: ${
      error instanceof Error ? error.message : 'Unknown error'
    }\n\nWould you like to try again?`
  }
}

async function handleToolCalls(
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>,
): Promise<Array<{ tool_name: string; content: string }>> {
  const toolResults = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const result = await callMCPTool(toolCall.name, toolCall.input)

      const textContent = result.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text || '')
        .join('\n')

      return {
        tool_name: toolCall.name,
        content: textContent,
      }
    }),
  )

  return toolResults
}

async function processMessageWithTools(
  messages: Message[],
  sessionUserId: string,
): Promise<{ content: string; hasToolCalls: boolean }> {
  const tools = await getMCPTools()

  const toolDefs = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: tool.inputSchema.properties,
      required: tool.inputSchema.required || [],
    },
  }))

  const userMessages = messages.filter((m) => m.role === 'user')
  const lastUserMessage = userMessages[userMessages.length - 1]

  if (!lastUserMessage) {
    return { content: 'No user message found', hasToolCalls: false }
  }

  let hasToolCalls = false

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      tools: toolDefs as any,
    })

    const contentBlocks = response.content
    let assistantText = ''

    const toolUseBlocks = contentBlocks.filter((b) => b.type === 'tool_use')
    const textBlocks = contentBlocks.filter((b) => b.type === 'text')

    if (textBlocks.length > 0) {
      assistantText = textBlocks
        .map((b) => ('text' in b ? b.text : ''))
        .join('\n')
    }

    if (toolUseBlocks.length > 0) {
      hasToolCalls = true

      const toolCalls = toolUseBlocks.map((block) => ({
        name: block.name,
        input: block.input as Record<string, unknown>,
      }))

      const toolResults = await handleToolCalls(toolCalls)

      const toolResultMessage = toolResults
        .map((r) => `[Tool: ${r.tool_name}]\n${r.content}`)
        .join('\n\n')

      const continuationResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          ...messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          {
            role: 'assistant',
            content: assistantText,
          },
          {
            role: 'user',
            content: `Here are the results from the tools I called:\n\n${toolResultMessage}\n\nPlease provide a helpful response based on these results.`,
          },
        ],
        tools: toolDefs as any,
      })

      const continuationText = continuationResponse.content
        .filter((b) => b.type === 'text')
        .map((b) => ('text' in b ? b.text : ''))
        .join('\n')

      assistantText = continuationText
    }

    return { content: assistantText, hasToolCalls }
  } catch (error) {
    console.error('Chat with tools error:', error)
    throw error
  }
}

async function processStreamingMessage(
  messages: Message[],
  conversationId?: string,
): Promise<ReadableStream> {
  const encoder = new TextEncoder()

  const workflow = conversationId ? getWorkflow(conversationId) : null
  const lastUserMessage = messages[messages.length - 1]

  if (workflow && lastUserMessage?.role === 'user') {
    const { response, updatedWorkflow } = await handleWorkflowStep(
      lastUserMessage.content,
      workflow,
      'user',
    )

    if (updatedWorkflow && conversationId) {
      setWorkflow(conversationId, updatedWorkflow)
    }

    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(response))
        controller.close()
      },
    })
  }

  if (lastUserMessage?.role === 'user' && !workflow && conversationId) {
    const content = lastUserMessage.content.toLowerCase()

    const entityType = extractEntityTypeFromContent(content)
    const action = extractActionFromContent(content)

    if (entityType && action === 'create') {
      const newWorkflow = createWorkflowState(
        conversationId,
        entityType,
        action,
      )
      setWorkflow(conversationId, newWorkflow)

      return new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(getStepPrompt('init', entityType)))
          controller.enqueue(encoder.encode('\n\n'))
          controller.enqueue(
            encoder.encode(getStepPrompt('collect_name', entityType)),
          )
          controller.close()
        },
      })
    }
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const tools = await getMCPTools()

        const toolDefs = tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: {
            type: 'object',
            properties: tool.inputSchema.properties,
            required: tool.inputSchema.required || [],
          },
        }))

        const stream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          tools: toolDefs as any,
        })

        let assistantContent = ''
        let hasToolUse = false
        let toolUseData: Array<{
          name: string
          input: Record<string, unknown>
        }> = []

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const text = event.delta.text
            assistantContent += text
            controller.enqueue(encoder.encode(text))
          } else if (
            event.type === 'content_block_start' &&
            event.content_block.type === 'tool_use'
          ) {
            hasToolUse = true
            toolUseData.push({
              name: event.content_block.name,
              input: event.content_block.input as Record<string, unknown>,
            })
          }
        }

        if (hasToolUse && toolUseData.length > 0) {
          controller.enqueue(encoder.encode('\n\n[Processing tool calls...]\n'))

          const toolResults = await handleToolCalls(toolUseData)

          const toolResultMessage = toolResults
            .map((r) => `[Tool: ${r.tool_name}]\n${r.content}`)
            .join('\n\n')

          controller.enqueue(encoder.encode(toolResultMessage + '\n\n'))

          const continuationStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [
              ...messages.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
              })),
              { role: 'assistant', content: assistantContent },
              {
                role: 'user',
                content: `Here are the results from the tools I called:\n\n${toolResultMessage}\n\nPlease provide a helpful response based on these results.`,
              },
            ],
            tools: toolDefs as any,
          })

          for await (const event of continuationStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 },
      )
    }

    if (stream) {
      const conversationId = body.conversationId || `conv-${Date.now()}`
      const readableStream = await processStreamingMessage(
        messages,
        conversationId,
      )

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    const result = await processMessageWithTools(messages, session.user.id)

    return NextResponse.json({ message: result.content })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 },
    )
  }
}

process.on('SIGTERM', async () => {
  await closeMCPClient()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await closeMCPClient()
  process.exit(0)
})
