import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { MCPServerContext } from './index.js';
export interface AuthContext {
    userId: string;
    sessionToken?: string;
    authMethod: 'jwt' | 'apikey';
}
interface APIKey {
    key: string;
    userId: string;
    name: string;
    createdAt: Date;
    expiresAt?: Date;
}
export declare function generateAPIKey(userId: string, name: string, expiresAt?: Date): string;
export declare function createAuthMiddleware(): (request: CallToolRequest) => Promise<AuthContext>;
export declare function validateOrganizationAccess(userId: string, organizationId: string, context: MCPServerContext): Promise<boolean>;
export declare function validateOrganizationOwnership(userId: string, organizationId: string, context: MCPServerContext): Promise<boolean>;
export declare function revokeAPIKey(apiKey: string): boolean;
export declare function listAPIKeys(userId: string): APIKey[];
export {};
