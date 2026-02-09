"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/processes - List processes
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        const departmentId = searchParams.get("departmentId");
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
        const processRepository = (0, repositories_1.getProcessRepository)();
        let processesResult;
        if (departmentId) {
            processesResult = await processRepository.findByDepartmentId(departmentId);
        }
        else {
            processesResult = await processRepository.findByOrganizationId(organizationId);
        }
        if ((0, result_1.isFailure)(processesResult)) {
            return server_1.NextResponse.json({ error: processesResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ processes: processesResult.data });
    }
    catch (error) {
        console.error("Error fetching processes:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/processes - Create a new process
async function POST(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { name, description, steps, organizationId, departmentId } = await request.json();
        if (!name || !organizationId || !departmentId || !steps) {
            return server_1.NextResponse.json({ error: "name, organizationId, departmentId, and steps are required" }, { status: 400 });
        }
        // Verify user has access to this organization
        const organizationRepository = (0, repositories_1.getOrganizationRepository)();
        const orgResult = await organizationRepository.findById(organizationId);
        if ((0, result_1.isFailure)(orgResult) || !orgResult.data) {
            return server_1.NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 });
        }
        if (orgResult.data.ownerId !== session.user.id) {
            return server_1.NextResponse.json({ error: "Only organization owner can create processes" }, { status: 403 });
        }
        // Verify department exists
        const departmentRepository = (0, repositories_1.getDepartmentRepository)();
        const deptResult = await departmentRepository.findById(departmentId);
        if ((0, result_1.isFailure)(deptResult) || !deptResult.data) {
            return server_1.NextResponse.json({ error: "Department not found" }, { status: 404 });
        }
        if (deptResult.data.organizationId !== organizationId) {
            return server_1.NextResponse.json({ error: "Department must belong to the organization" }, { status: 400 });
        }
        const processRepository = (0, repositories_1.getProcessRepository)();
        const createResult = await processRepository.create({
            name,
            description: description || undefined,
            steps: JSON.stringify(steps),
            organizationId,
            departmentId,
            createdById: session.user.id,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: "Process created successfully", process: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating process:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
