import { NextResponse } from "next/server"
import { PrismaClient } from "../../../generated"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// GET /api/notifications - Get user notifications
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"

    const where: Record<string, unknown> = {
      userId: session.user.id,
    }

    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationIds, markAllAsRead } = await request.json()

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
        },
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: {
          read: true,
        },
      })
    }

    return NextResponse.json({ message: "Notifications updated" })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/notifications - Create a notification (for internal use)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // This endpoint should only be called by the server, not directly by clients
    // In production, you'd want additional validation here
    const { userId, type, message, data } = await request.json()

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        data: data ? JSON.stringify(data) : undefined,
      },
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (notificationId) {
      await prisma.notification.delete({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      })
    } else {
      // Delete all read notifications
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
          read: true,
        },
      })
    }

    return NextResponse.json({ message: "Notifications deleted" })
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to create notifications from other parts of the app
export async function createNotification(
  userId: string,
  type: string,
  message: string,
  data?: Record<string, unknown>
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        data: data ? JSON.stringify(data) : undefined,
      },
    })
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}
