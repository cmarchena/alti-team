import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDepartmentRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/departments - List departments by organizationId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId")

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)

    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      )
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const departmentRepository = getDepartmentRepository()
    const departmentsResult = await departmentRepository.findByOrganizationId(organizationId)

    if (isFailure(departmentsResult)) {
      return NextResponse.json(
        { error: departmentsResult.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ departments: departmentsResult.data })
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create a new department
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, description, organizationId, parentId } = await request.json()

    if (!name || !organizationId) {
      return NextResponse.json(
        { error: "Name and organizationId are required" },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const organizationRepository = getOrganizationRepository()
    const orgResult = await organizationRepository.findById(organizationId)

    if (isFailure(orgResult) || !orgResult.data) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      )
    }

    if (orgResult.data.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only organization owner can create departments" },
        { status: 403 }
      )
    }

    // Validate parent department if provided
    if (parentId) {
      const parentResult = await departmentRepository.findById(parentId)
      if (isFailure(parentResult) || !parentResult.data) {
        return NextResponse.json(
          { error: "Parent department not found" },
          { status: 400 }
        )
      }
      if (parentResult.data.organizationId !== organizationId) {
        return NextResponse.json(
          { error: "Parent department must be in the same organization" },
          { status: 400 }
        )
      }
    }

    const departmentRepository = getDepartmentRepository()
    const createResult = await departmentRepository.create({
      name,
      description: description || undefined,
      organizationId,
      parentId: parentId || undefined,
    })

    if (isFailure(createResult)) {
      return NextResponse.json(
        { error: createResult.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Department created successfully", department: createResult.data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating department:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
