import { NextResponse } from "next/server"
import { PrismaClient } from "@/generated"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

// Helper function to check if user has access to the organization
async function checkOrganizationAccess(organizationId: string, userId: string) {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      OR: [
        { ownerId: userId },
        {
          teamMembers: {
            some: { userId },
          },
        },
      ],
    },
  })
  return !!organization
}

// GET /api/processes/[id] - Get a single process
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    })

    if (!process) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }

    const hasAccess = await checkOrganizationAccess(process.organizationId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ process })
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
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, steps } = await request.json()

    const process = await prisma.process.update({
      where: { id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        steps: steps ? (typeof steps === "string" ? steps : JSON.stringify(steps)) : undefined,
      },
    })

    return NextResponse.json({ message: "Process updated successfully", process })
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
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.process.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Process deleted successfully" })
  } catch (error) {
    console.error("Error deleting process:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
