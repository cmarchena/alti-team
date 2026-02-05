import { spawn } from 'child_process'

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface ToolResult {
  content: Array<{ type: string; text?: string }>
  isError?: boolean
}

class MCPProcessClient {
  private process: ReturnType<typeof spawn> | null = null
  private messageBuffer = ''
  private pendingRequests = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >()
  private nextId = 0
  private toolsCache: MCPTool[] | null = null

  async connect(): Promise<void> {
    if (this.process) return

    this.process = spawn(
      'node',
      ['--loader', 'ts-node/esm', 'src/mcp-server/index.ts'],
      {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      },
    )

    this.process.stdout?.on('data', (data) => {
      this.handleData(data.toString())
    })

    this.process.stderr?.on('data', (data) => {
      console.error('MCP Server stderr:', data.toString())
    })

    this.process.on('error', (error) => {
      console.error('MCP Server process error:', error)
    })

    await new Promise<void>((resolve) => {
      const checkReady = () => {
        if (this.process && this.process.stdout) {
          this.process.stdout.once('data', checkReady)
        } else {
          resolve()
        }
      }
      checkReady()
    })
  }

  private handleData(data: string): void {
    this.messageBuffer += data

    let newlineIndex: number
    while ((newlineIndex = this.messageBuffer.indexOf('\n')) !== -1) {
      const message = this.messageBuffer.slice(0, newlineIndex)
      this.messageBuffer = this.messageBuffer.slice(newlineIndex + 1)

      if (message.trim()) {
        try {
          const parsed = JSON.parse(message)
          if (parsed.id && this.pendingRequests.has(parsed.id as string)) {
            const pending = this.pendingRequests.get(parsed.id as string)!
            this.pendingRequests.delete(parsed.id as string)

            if (parsed.error) {
              pending.reject(
                new Error(
                  (parsed.error as { message?: string }).message ||
                    'Unknown error',
                ),
              )
            } else {
              pending.resolve(parsed.result)
            }
          }
        } catch {
          console.error('Failed to parse MCP message:', message)
        }
      }
    }
  }

  private sendMessage(message: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin) {
        reject(new Error('MCP process stdin not available'))
        return
      }

      const id = String(++this.nextId)
      const messageStr = JSON.stringify({ ...message, id }) + '\n'

      this.pendingRequests.set(id, { resolve, reject })

      if (!this.process.stdin.write(messageStr)) {
        this.pendingRequests.delete(id)
        reject(new Error('Failed to write to MCP process'))
      }
    })
  }

  async listTools(): Promise<MCPTool[]> {
    if (this.toolsCache) {
      return this.toolsCache
    }

    try {
      const result = (await this.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
      })) as { tools: MCPTool[] }

      this.toolsCache = result.tools
      return this.toolsCache
    } catch (error) {
      console.error('Failed to list MCP tools:', error)
      return []
    }
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    try {
      const result = await this.sendMessage({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name,
          arguments: args,
        },
      })

      return result as ToolResult
    } catch (error) {
      console.error(`Failed to call tool ${name}:`, error)
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      }
    }
  }

  async close(): Promise<void> {
    if (this.process) {
      this.process.kill()
      this.process.stdin?.end()
      this.process.stdout?.destroy()
      this.process.stderr?.destroy()
      this.process = null
    }
    this.toolsCache = null
  }
}

let mcpClientInstance: MCPProcessClient | null = null

export async function getMCPClient(): Promise<MCPProcessClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPProcessClient()
    await mcpClientInstance.connect()
  }
  return mcpClientInstance
}

export async function closeMCPClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.close()
    mcpClientInstance = null
  }
}

export async function getMCPTools(): Promise<MCPTool[]> {
  const client = await getMCPClient()
  return client.listTools()
}

export async function callMCPTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const client = await getMCPClient()
  return client.callTool(name, args)
}

export function getMCPToolsForClaude(): Array<{
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}> {
  const tools = global.__mcpToolsCache
  if (!tools) return []

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: tool.inputSchema.properties,
      required: tool.inputSchema.required,
    },
  }))
}

declare global {
  var __mcpToolsCache: MCPTool[] | undefined
}

export async function getCachedMCPTools(): Promise<MCPTool[]> {
  if (global.__mcpToolsCache) {
    return global.__mcpToolsCache
  }

  const tools = await getMCPTools()
  global.__mcpToolsCache = tools
  return tools
}
