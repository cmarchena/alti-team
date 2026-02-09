"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMCPClient = getMCPClient;
exports.closeMCPClient = closeMCPClient;
exports.getMCPTools = getMCPTools;
exports.callMCPTool = callMCPTool;
exports.getMCPToolsForClaude = getMCPToolsForClaude;
exports.getCachedMCPTools = getCachedMCPTools;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class MCPProcessClient {
    constructor() {
        this.process = null;
        this.messageBuffer = '';
        this.pendingRequests = new Map();
        this.nextId = 0;
        this.toolsCache = null;
        this.ready = false;
        this.readyResolve = null;
    }
    async connect() {
        if (this.process)
            return;
        const distPath = path_1.default.join(process.cwd(), 'dist/mcp-server/index.js');
        if (!fs_1.default.existsSync(distPath)) {
            console.warn('MCP server not built. Building...');
            await this.buildMCP();
        }
        this.process = (0, child_process_1.spawn)('node', [distPath], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
        });
        this.process.stdout?.on('data', (data) => {
            const msg = data.toString();
            this.handleData(msg);
            if (msg.includes('"message":"Handshake complete"')) {
                this.ready = true;
                if (this.readyResolve) {
                    this.readyResolve();
                    this.readyResolve = null;
                }
            }
        });
        this.process.stderr?.on('data', (data) => {
            console.error('MCP Server stderr:', data.toString());
        });
        this.process.on('error', (error) => {
            console.error('MCP Server process error:', error);
        });
        this.process.on('exit', (code) => {
            console.error(`MCP Server exited with code ${code}`);
            this.process = null;
            this.ready = false;
        });
        await new Promise((resolve) => {
            this.readyResolve = resolve;
            setTimeout(() => {
                this.ready = true;
                resolve();
            }, 2000);
        });
    }
    async buildMCP() {
        return new Promise((resolve, reject) => {
            const build = (0, child_process_1.spawn)('npx', ['tsc', '-p', 'tsconfig.mcp.json'], {
                cwd: process.cwd(),
                stdio: 'inherit',
            });
            build.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error('Failed to build MCP server'));
                }
            });
        });
    }
    handleData(data) {
        this.messageBuffer += data;
        let newlineIndex;
        while ((newlineIndex = this.messageBuffer.indexOf('\n')) !== -1) {
            const message = this.messageBuffer.slice(0, newlineIndex);
            this.messageBuffer = this.messageBuffer.slice(newlineIndex + 1);
            if (message.trim()) {
                try {
                    const parsed = JSON.parse(message);
                    if (parsed.id && this.pendingRequests.has(parsed.id)) {
                        const pending = this.pendingRequests.get(parsed.id);
                        this.pendingRequests.delete(parsed.id);
                        if (parsed.error) {
                            pending.reject(new Error(parsed.error.message ||
                                'Unknown error'));
                        }
                        else {
                            pending.resolve(parsed.result);
                        }
                    }
                }
                catch {
                    console.error('Failed to parse MCP message:', message);
                }
            }
        }
    }
    sendMessage(message) {
        return new Promise((resolve, reject) => {
            if (!this.process?.stdin) {
                reject(new Error('MCP process stdin not available'));
                return;
            }
            const id = String(++this.nextId);
            const messageStr = JSON.stringify({ ...message, id }) + '\n';
            this.pendingRequests.set(id, { resolve, reject });
            if (!this.process.stdin.write(messageStr)) {
                this.pendingRequests.delete(id);
                reject(new Error('Failed to write to MCP process'));
            }
        });
    }
    async listTools() {
        if (this.toolsCache) {
            return this.toolsCache;
        }
        try {
            const result = (await this.sendMessage({
                jsonrpc: '2.0',
                method: 'tools/list',
                params: {},
            }));
            this.toolsCache = result.tools;
            return this.toolsCache;
        }
        catch (error) {
            console.error('Failed to list MCP tools:', error);
            return [];
        }
    }
    async callTool(name, args) {
        try {
            const result = await this.sendMessage({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                    name,
                    arguments: args,
                },
            });
            return result;
        }
        catch (error) {
            console.error(`Failed to call tool ${name}:`, error);
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
    }
    async close() {
        if (this.process) {
            this.process.kill();
            this.process.stdin?.end();
            this.process.stdout?.destroy();
            this.process.stderr?.destroy();
            this.process = null;
        }
        this.toolsCache = null;
        this.ready = false;
    }
}
let mcpClientInstance = null;
async function getMCPClient() {
    if (!mcpClientInstance) {
        mcpClientInstance = new MCPProcessClient();
        await mcpClientInstance.connect();
    }
    return mcpClientInstance;
}
async function closeMCPClient() {
    if (mcpClientInstance) {
        await mcpClientInstance.close();
        mcpClientInstance = null;
    }
}
async function getMCPTools() {
    const client = await getMCPClient();
    return client.listTools();
}
async function callMCPTool(name, args) {
    const client = await getMCPClient();
    return client.callTool(name, args);
}
function getMCPToolsForClaude() {
    const tools = global.__mcpToolsCache;
    if (!tools)
        return [];
    return tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: {
            type: 'object',
            properties: tool.inputSchema.properties,
            required: tool.inputSchema.required,
        },
    }));
}
async function getCachedMCPTools() {
    if (global.__mcpToolsCache) {
        return global.__mcpToolsCache;
    }
    const tools = await getMCPTools();
    global.__mcpToolsCache = tools;
    return tools;
}
