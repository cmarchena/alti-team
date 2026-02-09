"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production";
async function validateToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded.sub;
    }
    catch {
        return null;
    }
}
// GET /api/organizations - List all organizations for the current user
async function GET(request) {
    try {
        const userId = await validateToken(request.headers.get("authorization"));
        if (!userId) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const organizationsResult = await organizationRepository.findByOwnerId(userId);
        if ((0, result_1.isFailure)(organizationsResult)) {
            return server_1.NextResponse.json({ error: organizationsResult.error.message }, { status: 500 });
        }
        const organizationsWithCounts = organizationsResult.data.map(org => ({
            ...org,
            _count: {
                departments: 0,
                teamMembers: 0,
                projects: 0,
            },
        }));
        return server_1.NextResponse.json({ organizations: organizationsWithCounts });
    }
    catch (error) {
        console.error("Error fetching organizations:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/organizations - Create a new organization
async function POST(request) {
    try {
        const userId = await validateToken(request.headers.get("authorization"));
        if (!userId) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { name, description } = await request.json();
        if (!name) {
            return server_1.NextResponse.json({ error: "Organization name is required" }, { status: 400 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const createResult = await organizationRepository.create({
            name,
            description: description || undefined,
            ownerId: userId,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Organization created successfully", organization: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating organization:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
