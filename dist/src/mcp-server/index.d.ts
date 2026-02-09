import { getRepositories } from '../lib/repositories/index.js';
import './tools/user.js';
import './tools/project.js';
import './tools/organization.js';
import './tools/task.js';
import './tools/team.js';
import './tools/department.js';
import './tools/process.js';
import './tools/resource.js';
import './tools/member.js';
import './tools/search.js';
import './tools/notification.js';
import './tools/reports.js';
import './tools/scheduling.js';
import './tools/integrations.js';
import './tools/insights.js';
export interface MCPServerContext {
    repositories: ReturnType<typeof getRepositories>;
    userId?: string;
}
export declare function registerTool(toolDef: {
    name: string;
    description: string;
    inputSchema: any;
    handler: (args: any, context: MCPServerContext) => Promise<any>;
}): void;
export declare const globalContext: MCPServerContext;
