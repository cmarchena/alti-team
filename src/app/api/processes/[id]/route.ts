import { NextResponse } from "next/server"
import { getServerSession } from "nextauth"
import { authOptions } from "@/lib/auth"
import { getProcessRepository, getProjectRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/processes/[id] - Get a single process
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

    const processRepository = getProcessRepository()
    const processResult = await processRepository.findById(id)

    if (isFailure(processResult) || !processResult.data) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }

    return NextResponse.json({ process: processResult.data })
  } catch (error) {
    console.error("Error fetching process:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/processes/[id] - Update a process
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

    const processRepository = getProcessRepository()
    const processResult = await processRepository.findById(id)

    if (isFailure(processResult) || !processResult.data) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }

    const updateResult = await processRepository.update(id, updates)

    if (isFailure(updateResult)) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ process: updateResult.data })
  } catch (error) {
    console.error("Error updating process:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/processes/[id] - Delete a process
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

    const processRepository = getProcessRepository()
    const processResult = await processRepository.findById(id)

    if (isFailure(processResult) || !processResult.data) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }

    const deleteResult = await processRepository.delete(id)

    if (isFailure(deleteResult)) {
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Process deleted successfully" })
  } catch (error) {
    console.error("Error deleting process:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
