import { NextResponse } from "next/server"
import { PrismaClient } from "../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

const prisma = new PrismaClient()

// Allowed file types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]

// Max file size: 10MB
const MAX_SIZE = 10 * 1024 * 1024

// Helper function to check if user has access to the project
async function checkProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: {
        include: {
          teamMembers: {
            where: { userId },
          },
        },
      },
    },
  })

  if (!project) return false
  if (project.organization.ownerId === userId) return true
  if (project.organization.teamMembers.length > 0) return true
  return false
}

// POST /api/upload - Upload a file
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null
    const name = formData.get("name") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      )
    }

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Generate unique filename
    const ext = path.extname(file.name)
    const uniqueName = `${crypto.randomUUID()}${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", projectId)

    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true })

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, uniqueName)
    await writeFile(filePath, buffer)

    // Determine resource type
    let resourceType = "OTHER"
    if (file.type.startsWith("image/")) {
      resourceType = "IMAGE"
    } else if (file.type.startsWith("video/")) {
      resourceType = "VIDEO"
    } else if (file.type.includes("pdf")) {
      resourceType = "DOCUMENT"
    } else if (file.type.includes("word") || file.type.includes("excel") || file.type.includes("spreadsheet")) {
      resourceType = "DOCUMENT"
    }

    // Create resource in database
    const resource = await prisma.resource.create({
      data: {
        name: name || file.name,
        type: resourceType,
        url: `/uploads/${projectId}/${uniqueName}`,
        projectId,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      message: "File uploaded successfully",
      resource,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
