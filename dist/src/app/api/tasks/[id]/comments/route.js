"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/tasks/[id]/comments - Get comments for a task
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: taskId } = await params;
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const taskResult = await taskRepository.findById(taskId);
        if ((0, result_1.isFailure)(taskResult) || !taskResult.data) {
            return server_1.NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        const projectRepository = (0, repositories_1.getProjectRepository)();
        const projectResult = await projectRepository.findById(taskResult.data.projectId);
        if ((0, result_1.isFailure)(projectResult) || !projectResult.data) {
            return server_1.NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        // TODO: Verify user has access to the project
        const commentRepository = (0, repositories_1.getCommentRepository)();
        const commentsResult = await commentRepository.findByTaskId(taskId);
        if ((0, result_1.isFailure)(commentsResult)) {
            return server_1.NextResponse.json({ error: commentsResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ comments: commentsResult.data });
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/tasks/[id]/comments - Add a comment to a task
async function POST(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: taskId } = await params;
        const { content, parentId } = await request.json();
        if (!content) {
            return server_1.NextResponse.json({ error: "content is required" }, { status: 400 });
        }
        const taskRepository = (0, repositories_1.getTaskRepository)();
        const taskResult = await taskRepository.findById(taskId);
        if ((0, result_1.isFailure)(taskResult) || !taskResult.data) {
            return server_1.NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        const commentRepository = (0, repositories_1.getCommentRepository)();
        const createResult = await commentRepository.create({
            content,
            taskId,
            userId: session.user.id,
            parentId: parentId || undefined,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Comment added successfully", comment: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating comment:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
