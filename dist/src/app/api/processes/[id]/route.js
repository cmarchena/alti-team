"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/processes/[id] - Get a single process
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const processRepository = (0, repositories_1.getProcessRepository)();
        const processResult = await processRepository.findById(id);
        if ((0, result_1.isFailure)(processResult) || !processResult.data) {
            return server_1.NextResponse.json({ error: "Process not found" }, { status: 404 });
        }
        return server_1.NextResponse.json({ process: processResult.data });
    }
    catch (error) {
        console.error("Error fetching process:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// PATCH /api/processes/[id] - Update a process
async function PATCH(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const updates = await request.json();
        const processRepository = (0, repositories_1.getProcessRepository)();
        const processResult = await processRepository.findById(id);
        if ((0, result_1.isFailure)(processResult) || !processResult.data) {
            return server_1.NextResponse.json({ error: "Process not found" }, { status: 404 });
        }
        const updateResult = await processRepository.update(id, updates);
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ process: updateResult.data });
    }
    catch (error) {
        console.error("Error updating process:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// DELETE /api/processes/[id] - Delete a process
async function DELETE(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const processRepository = (0, repositories_1.getProcessRepository)();
        const processResult = await processRepository.findById(id);
        if ((0, result_1.isFailure)(processResult) || !processResult.data) {
            return server_1.NextResponse.json({ error: "Process not found" }, { status: 404 });
        }
        const deleteResult = await processRepository.delete(id);
        if ((0, result_1.isFailure)(deleteResult)) {
            return server_1.NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Process deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting process:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
