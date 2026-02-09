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
// GET /api/departments/[id] - Get a single department
async function GET(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const departmentRepository = (0, repositories_1.getDepartmentRepository)();
        const departmentResult = await departmentRepository.findById(id);
        if ((0, result_1.isFailure)(departmentResult) || !departmentResult.data) {
            return server_1.NextResponse.json({ error: "Department not found" }, { status: 404 });
        }
        return server_1.NextResponse.json({ department: departmentResult.data });
    }
    catch (error) {
        console.error("Error fetching department:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// PATCH /api/departments/[id] - Update a department
async function PATCH(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const updates = await request.json();
        const departmentRepository = (0, repositories_1.getDepartmentRepository)();
        const departmentResult = await departmentRepository.findById(id);
        if ((0, result_1.isFailure)(departmentResult) || !departmentResult.data) {
            return server_1.NextResponse.json({ error: "Department not found" }, { status: 404 });
        }
        const updateResult = await departmentRepository.update(id, updates);
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ department: updateResult.data });
    }
    catch (error) {
        console.error("Error updating department:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// DELETE /api/departments/[id] - Delete a department
async function DELETE(request, { params }) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const departmentRepository = (0, repositories_1.getDepartmentRepository)();
        const departmentResult = await departmentRepository.findById(id);
        if ((0, result_1.isFailure)(departmentResult) || !departmentResult.data) {
            return server_1.NextResponse.json({ error: "Department not found" }, { status: 404 });
        }
        const deleteResult = await departmentRepository.delete(id);
        if ((0, result_1.isFailure)(deleteResult)) {
            return server_1.NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Department deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting department:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
