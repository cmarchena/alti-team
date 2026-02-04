import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getDepartmentRepository, getOrganizationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/departments/[id] - Get a single department
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const departmentRepository = getDepartmentRepository()
    const departmentResult = await departmentRepository.findById(id)

    if (isFailure(departmentResult) || !departmentResult.data) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    return NextResponse.json({ department: departmentResult.data })
  } catch (error) {
    console.error("Error fetching department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/departments/[id] - Update a department
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()

    const departmentRepository = getDepartmentRepository()
    const departmentResult = await departmentRepository.findById(id)

    if (isFailure(departmentResult) || !departmentResult.data) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const updateResult = await departmentRepository.update(id, updates)

    if (isFailure(updateResult)) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ department: updateResult.data })
  } catch (error) {
    console.error("Error updating department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/departments/[id] - Delete a department
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const departmentRepository = getDepartmentRepository()
    const departmentResult = await departmentRepository.findById(id)

    if (isFailure(departmentResult) || !departmentResult.data) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const deleteResult = await departmentRepository.delete(id)

    if (isFailure(deleteResult)) {
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
