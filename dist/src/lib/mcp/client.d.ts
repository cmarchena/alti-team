export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}
export interface ToolResult {
    content: Array<{
        type: string;
        text?: string;
    }>;
    isError?: boolean;
}
declare class MCPProcessClient {
    private process;
    private messageBuffer;
    private pendingRequests;
    private nextId;
    private toolsCache;
    private ready;
    private readyResolve;
    connect(): Promise<void>;
    private buildMCP;
    private handleData;
    private sendMessage;
    listTools(): Promise<MCPTool[]>;
    callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
    close(): Promise<void>;
}
export declare function getMCPClient(): Promise<MCPProcessClient>;
export declare function closeMCPClient(): Promise<void>;
export declare function getMCPTools(): Promise<MCPTool[]>;
export declare function callMCPTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
export declare function getMCPToolsForClaude(): Array<{
    name: string;
    description: string;
    input_schema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}>;
declare global {
    var __mcpToolsCache: MCPTool[] | undefined;
}
export declare function getCachedMCPTools(): Promise<MCPTool[]>;
export {};
