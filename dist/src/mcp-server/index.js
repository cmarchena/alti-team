"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalContext = void 0;
exports.registerTool = registerTool;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const index_js_2 = require("../lib/repositories/index.js");
const auth_js_1 = require("./auth.js");
const logger_js_1 = require("./logger.js");
const health_js_1 = require("./health.js");
require("./tools/user.js");
require("./tools/project.js");
require("./tools/organization.js");
require("./tools/task.js");
require("./tools/team.js");
require("./tools/department.js");
require("./tools/process.js");
require("./tools/resource.js");
require("./tools/member.js");
require("./tools/search.js");
require("./tools/notification.js");
require("./tools/reports.js");
require("./tools/scheduling.js");
require("./tools/integrations.js");
require("./tools/insights.js");
// Tool registry
const toolRegistry = new Map();
// Register a tool
function registerTool(toolDef) {
    const tool = {
        name: toolDef.name,
        description: toolDef.description,
        inputSchema: toolDef.inputSchema,
    };
    toolRegistry.set(toolDef.name, { tool, handler: toolDef.handler });
}
// Create server context
function createServerContext() {
    return {
        repositories: (0, index_js_2.getRepositories)(),
        // userId will be set by authentication middleware
    };
}
// Global context for tool registration
exports.globalContext = createServerContext();
// Initialize server
function createServer() {
    const server = new index_js_1.Server({
        name: 'alti-team-mcp-server',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    const authMiddleware = (0, auth_js_1.createAuthMiddleware)();
    // List available tools
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
        const tools = Array.from(toolRegistry.values()).map(({ tool }) => tool);
        return { tools };
    });
    // Handle tool calls with authentication
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            // Authenticate the request
            const authContext = await authMiddleware(request);
            const toolEntry = toolRegistry.get(name);
            if (!toolEntry) {
                return {
                    content: [{ type: 'text', text: `Tool '${name}' not found` }],
                    isError: true,
                };
            }
            // Create context with authenticated user
            const context = {
                ...exports.globalContext,
                userId: authContext.userId,
            };
            return await toolEntry.handler(args, context);
        }
        catch (error) {
            console.error(`Error executing tool ${name}:`, error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    return server;
}
// Start the server
async function startServer() {
    (0, health_js_1.updateServerStartTime)();
    const server = createServer();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    logger_js_1.logger.info('AltiTeam MCP Server started');
    const healthCheckHandler = (0, health_js_1.createHealthCheckHandler)();
    const gracefulShutdown = async (signal) => {
        logger_js_1.logger.info(`Received ${signal}, shutting down gracefully`);
        await server.close();
        process.exit(0);
    };
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
// Start the server
startServer().catch((error) => {
    logger_js_1.logger.error('Failed to start MCP server', { error: String(error) });
    process.exit(1);
});
