import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js'
import { getRepositories } from '../lib/repositories/index.js'
import { createAuthMiddleware, validateOrganizationAccess } from './auth.js'
import './tools/user.js'
import './tools/project.js'
import './tools/organization.js'
import './tools/task.js'
import './tools/team.js'
import './tools/department.js'
import './tools/process.js'
import './tools/resource.js'
import './tools/member.js'
import './tools/search.js'
import './tools/notification.js'

// Context type for tool handlers
export interface MCPServerContext {
  repositories: ReturnType<typeof getRepositories>
  userId?: string // Will be set by authentication middleware
}

// Tool registry
const toolRegistry = new Map<string, { tool: Tool, handler: (args: any, context: MCPServerContext) => Promise<any> }>()

// Register a tool
export function registerTool(toolDef: { name: string, description: string, inputSchema: any, handler: (args: any, context: MCPServerContext) => Promise<any> }) {
  const tool: Tool = {
    name: toolDef.name,
    description: toolDef.description,
    inputSchema: toolDef.inputSchema,
  }

  toolRegistry.set(toolDef.name, { tool, handler: toolDef.handler })
}

// Create server context
function createServerContext(): MCPServerContext {
  return {
    repositories: getRepositories(),
    // userId will be set by authentication middleware
  }
}

// Global context for tool registration
export const globalContext = createServerContext()

// Initialize server
function createServer() {
  const server = new Server(
    {
      name: 'alti-team-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  const authMiddleware = createAuthMiddleware()

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = Array.from(toolRegistry.values()).map(({ tool }) => tool)
    return { tools }
  })

  // Handle tool calls with authentication
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    try {
      // Authenticate the request
      const authContext = await authMiddleware(request)

      const toolEntry = toolRegistry.get(name)
      if (!toolEntry) {
        return {
          content: [{ type: 'text', text: `Tool '${name}' not found` }],
          isError: true,
        }
      }

      // Create context with authenticated user
      const context: MCPServerContext = {
        ...globalContext,
        userId: authContext.userId,
      }

      return await toolEntry.handler(args, context)
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error)
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      }
    }
  })

  return server
}

// Start the server
async function startServer() {
  const server = createServer()
  const transport = new StdioServerTransport()

  await server.connect(transport)
  console.error('AltiTeam MCP Server started')
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start MCP server:', error)
  process.exit(1)
})