"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAPIKey = generateAPIKey;
exports.createAuthMiddleware = createAuthMiddleware;
exports.validateOrganizationAccess = validateOrganizationAccess;
exports.validateOrganizationOwnership = validateOrganizationOwnership;
exports.revokeAPIKey = revokeAPIKey;
exports.listAPIKeys = listAPIKeys;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret-for-development';
const API_KEY_PREFIX = 'altiteam_';
const apiKeys = new Map();
function generateAPIKey(userId, name, expiresAt) {
    const randomPart = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    const key = `${API_KEY_PREFIX}${randomPart}`;
    apiKeys.set(key, {
        key,
        userId,
        name,
        createdAt: new Date(),
        expiresAt,
    });
    return key;
}
async function validateJWT(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!decoded.sub) {
            throw new Error('Invalid token: missing user ID');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token expired. Please log in again.');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token. Please provide a valid authentication token.');
        }
        throw error;
    }
}
async function validateAPIKey(apiKey) {
    const key = apiKeys.get(apiKey);
    if (!key) {
        throw new Error('Invalid API key. Please provide a valid API key.');
    }
    if (key.expiresAt && key.expiresAt < new Date()) {
        apiKeys.delete(apiKey);
        throw new Error('API key expired. Please generate a new API key.');
    }
    return key;
}
function createAuthMiddleware() {
    return async (request) => {
        const authHeader = request._meta?.authorization || request.authorization;
        const apiKeyHeader = request._meta?.['x-api-key'] || request['x-api-key'];
        const sessionTokenHeader = request._meta?.['x-session-token'] ||
            request['x-session-token'];
        if (apiKeyHeader) {
            const apiKey = await validateAPIKey(apiKeyHeader);
            return {
                userId: apiKey.userId,
                sessionToken: apiKeyHeader,
                authMethod: 'apikey',
            };
        }
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : authHeader;
            const payload = await validateJWT(token);
            return {
                userId: payload.sub,
                sessionToken: token,
                authMethod: 'jwt',
            };
        }
        if (sessionTokenHeader) {
            const payload = await validateJWT(sessionTokenHeader);
            return {
                userId: payload.sub,
                sessionToken: sessionTokenHeader,
                authMethod: 'jwt',
            };
        }
        throw new Error('Authentication required. Please provide one of: Bearer token in Authorization header, x-api-key header, or x-session-token header.');
    };
}
async function validateOrganizationAccess(userId, organizationId, context) {
    const members = await context.repositories.teamMembers.findByOrganizationId(organizationId);
    if (!members.success) {
        return false;
    }
    return members.data.some((member) => member.userId === userId);
}
async function validateOrganizationOwnership(userId, organizationId, context) {
    const org = await context.repositories.organizations.findById(organizationId);
    if (!org.success || !org.data) {
        return false;
    }
    return org.data.ownerId === userId;
}
function revokeAPIKey(apiKey) {
    return apiKeys.delete(apiKey);
}
function listAPIKeys(userId) {
    const userKeys = [];
    apiKeys.forEach((key) => {
        if (key.userId === userId) {
            userKeys.push(key);
        }
    });
    return userKeys;
}
