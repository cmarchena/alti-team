import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getNotificationRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/notifications - Get user notifications
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"

    const notificationRepository = getNotificationRepository()
    const notificationsResult = await notificationRepository.findByUserId(session.user.id)

    if (isFailure(notificationsResult)) {
      return NextResponse.json({ error: notificationsResult.error.message }, { status: 500 })
    }

    let notifications = notificationsResult.data

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read)
    }

    // Get unread count
    const unreadCount = notifications.filter(n => !n.read).length

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
    const notificationRepository = getNotificationRepository()

    if (markAllAsRead) {
      await notificationRepository.markAllAsRead(session.user.id)
    } else if (notificationIds && Array.isArray(notificationIds)) {
      for (const id of notificationIds) {
        await notificationRepository.markAsRead(id)
      }
    }

    return NextResponse.json({ message: "Notifications updated successfully" })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/notifications - Create a notification (internal use)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow internal calls (or admin users)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, type, message } = await request.json()

    if (!userId || !type || !message) {
      return NextResponse.json({ error: "userId, type, and message are required" }, { status: 400 })
    }

    const notificationRepository = getNotificationRepository()
    const createResult = await notificationRepository.create({
      userId,
      type,
      message,
    })

    if (isFailure(createResult)) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ notification: createResult.data }, { status: 201 })
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
    const deleteAllRead = searchParams.get("deleteAllRead") === "true"

    const notificationRepository = getNotificationRepository()

    if (notificationId) {
      await notificationRepository.delete(notificationId)
    } else if (deleteAllRead) {
      await notificationRepository.deleteRead(session.user.id)
    }

    return NextResponse.json({ message: "Notifications deleted successfully" })
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
