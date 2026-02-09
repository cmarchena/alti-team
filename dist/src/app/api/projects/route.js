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
// GET /api/projects - List projects by organizationId
async function GET(request) {
    try {
        const userId = await validateToken(request.headers.get("authorization"));
        if (!userId) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        if (!organizationId) {
            return server_1.NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== userId) {
            return server_1.NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectsResult = await projectRepository.findByOrganizationId(organizationId);
        if ((0, result_1.isFailure)(projectsResult)) {
            return server_1.NextResponse.json({ error: projectsResult.error.message }, { status: 500 });
        }
        const projectsWithCounts = projectsResult.data.map(project => ({
            ...project,
            _count: {
                tasks: 0,
                resources: 0,
                projectMembers: 0,
            },
        }));
        return server_1.NextResponse.json({ projects: projectsWithCounts });
    }
    catch (error) {
        console.error("Error fetching projects:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/projects - Create a new project
async function POST(request) {
    try {
        const userId = await validateToken(request.headers.get("authorization"));
        if (!userId) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { name, description, organizationId, startDate, endDate } = await request.json();
        if (!name || !organizationId) {
            return server_1.NextResponse.json({ error: "Name and organizationId are required" }, { status: 400 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== userId) {
            return server_1.NextResponse.json({ error: "Only organization owner can create projects" }, { status: 403 });
        }
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const createResult = await projectRepository.create({
            name,
            description: description || undefined,
            organizationId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Project created successfully", project: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating project:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
