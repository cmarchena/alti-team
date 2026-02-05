import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { getMCPTools, callMCPTool, closeMCPClient } from '@/lib/mcp/client'

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
): Promise<ReadableStream> {
  const encoder = new TextEncoder()

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
      const readableStream = await processStreamingMessage(messages)

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
