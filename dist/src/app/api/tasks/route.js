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
// GET /api/tasks - List tasks by projectId
async function GET(request) {
    try {
        const userId = await validateToken(request.headers.get("authorization"));
        if (!userId) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");
        if (!projectId) {
            return server_1.NextResponse.json({ error: "projectId is required" }, { status: 400 });
        }
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(projectResult.data.organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== userId) {
            return server_1.NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const tasksResult = await taskRepository.findByProjectId(projectId);
        if ((0, result_1.isFailure)(tasksResult)) {
            return server_1.NextResponse.json({ error: tasksResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ tasks: tasksResult.data });
    }
    catch (error) {
        console.error("Error fetching tasks:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/tasks - Create a new task
async function POST(request) {
    try {
        const userId = await validateToken(request.headers.get("authorization"));
        if (!userId) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { title, description, projectId, assignedToId, priority, dueDate } = await request.json();
        if (!title || !projectId) {
            return server_1.NextResponse.json({ error: "Title and projectId are required" }, { status: 400 });
        }
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
        }
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(projectResult.data.organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== userId) {
            return server_1.NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const createResult = await taskRepository.create({
            title,
            description: description || undefined,
            projectId,
            assignedToId: assignedToId || undefined,
            priority: priority || "medium",
            dueDate: dueDate ? new Date(dueDate) : undefined,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Task created successfully", task: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating task:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
