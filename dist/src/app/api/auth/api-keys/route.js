"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const auth_2 = require("@/mcp-server/auth");
async function GET(request) {
    const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
    if (!session?.user?.id) {
        return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const keys = (0, auth_2.listAPIKeys)(session.user.id);
    return server_1.NextResponse.json({ keys });
}
async function POST(request) {
    const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
    if (!session?.user?.id) {
        return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name, expiresInDays } = await request.json();
    if (!name || typeof name !== 'string') {
        return server_1.NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }
    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;
    const apiKey = (0, auth_2.generateAPIKey)(session.user.id, name, expiresAt);
    return server_1.NextResponse.json({
        apiKey,
        message: 'API key generated successfully. Save this key securely.',
    });
}
async function DELETE(request) {
    const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
    if (!session?.user?.id) {
        return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { apiKey } = await request.json();
    if (!apiKey || typeof apiKey !== 'string') {
        return server_1.NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    const revoked = (0, auth_2.revokeAPIKey)(apiKey);
    if (!revoked) {
        return server_1.NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }
    return server_1.NextResponse.json({ message: 'API key revoked successfully' });
}
