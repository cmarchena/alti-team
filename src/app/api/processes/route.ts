import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getProcessRepository, getOrganizationRepository, getDepartmentRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/processes - List processes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")
    const departmentId = searchParams.get("departmentId")

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 })
    }

    // Verify user has access to this organization
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)
    
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const processRepository = getProcessRepository()
    let processesResult

    if (departmentId) {
      processesResult = await processRepository.findByDepartmentId(departmentId)
    } else {
      processesResult = await processRepository.findByOrganizationId(organizationId)
    }

    if (isFailure(processesResult)) {
      return NextResponse.json({ error: processesResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ processes: processesResult.data })
  } catch (error) {
    console.error("Error fetching processes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/processes - Create a new process
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, steps, organizationId, departmentId } = await request.json()

    if (!name || !organizationId || !departmentId || !steps) {
      return NextResponse.json({ error: "name, organizationId, departmentId, and steps are required" }, { status: 400 })
    }

    // Verify user has access to this organization
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)
    
    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 403 })
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only organization owner can create processes" }, { status: 403 })
    }

    // Verify department exists
    const departmentRepository = getDepartmentRepository()
    const deptResult = await departmentRepository.findById(departmentId)
    
    if (isFailure(deptResult) || !deptResult.data) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    if (deptResult.data.organizationId !== organizationId) {
      return NextResponse.json({ error: "Department must belong to the organization" }, { status: 400 })
    }

    const processRepository = getProcessRepository()
    const createResult = await processRepository.create({
      name,
      description: description || undefined,
      steps: JSON.stringify(steps),
      organizationId,
      departmentId,
      createdById: session.user.id,
    })

    if (isFailure(createResult)) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Process created successfully", process: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating process:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
