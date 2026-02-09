"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/departments - List departments by organizationId
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        if (!organizationId) {
            return server_1.NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }
        // Verify user has access to this organization
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const departmentRepository = (0, repositories_1.getDepartmentRepository)();
        const departmentsResult = await departmentRepository.findByOrganizationId(organizationId);
        if ((0, result_1.isFailure)(departmentsResult)) {
            return server_1.NextResponse.json({ error: departmentsResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ departments: departmentsResult.data });
    }
    catch (error) {
        console.error("Error fetching departments:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/departments - Create a new department
async function POST(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { name, description, organizationId, parentId } = await request.json();
        if (!name || !organizationId) {
            return server_1.NextResponse.json({ error: "Name and organizationId are required" }, { status: 400 });
        }
        // Verify user has access to this organization
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can create departments" }, { status: 403 });
        }
        // Validate parent department if provided
        if (parentId) {
            const parentResult = await departmentRepository.findById(parentId);
            if ((0, result_1.isFailure)(parentResult) || !parentResult.data) {
                return server_1.NextResponse.json({ error: "Parent department not found" }, { status: 400 });
            }
            if (parentResult.data.organizationId !== organizationId) {
                return server_1.NextResponse.json({ error: "Parent department must be in the same organization" }, { status: 400 });
            }
        }
        const departmentRepository = (0, repositories_1.getDepartmentRepository)();
        const createResult = await departmentRepository.create({
            name,
            description: description || undefined,
            organizationId,
            parentId: parentId || undefined,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Department created successfully", department: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating department:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
