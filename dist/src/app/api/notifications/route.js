"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
exports.POST = POST;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
// GET /api/notifications - Get user notifications
async function GET(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const notificationRepository = (0, repositories_1.getNotificationRepository)();
        const notificationsResult = await notificationRepository.findByUserId(session.user.id);
        if ((0, result_1.isFailure)(notificationsResult)) {
            return server_1.NextResponse.json({ error: notificationsResult.error.message }, { status: 500 });
        }
        let notifications = notificationsResult.data;
        if (unreadOnly) {
            notifications = notifications.filter(n => !n.read);
        }
        // Get unread count
        const unreadCount = notifications.filter(n => !n.read).length;
        return server_1.NextResponse.json({ notifications, unreadCount });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// PATCH /api/notifications - Mark notifications as read
async function PATCH(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { notificationIds, markAllAsRead } = await request.json();
        const notificationRepository = (0, repositories_1.getNotificationRepository)();
        if (markAllAsRead) {
            await notificationRepository.markAllAsRead(session.user.id);
        }
        else if (notificationIds && Array.isArray(notificationIds)) {
            for (const id of notificationIds) {
                await notificationRepository.markAsRead(id);
            }
        }
        return server_1.NextResponse.json({ message: "Notifications updated successfully" });
    }
    catch (error) {
        console.error("Error updating notifications:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// POST /api/notifications - Create a notification (internal use)
async function POST(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        // Only allow internal calls (or admin users)
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { userId, type, message } = await request.json();
        if (!userId || !type || !message) {
            return server_1.NextResponse.json({ error: "userId, type, and message are required" }, { status: 400 });
        }
        const notificationRepository = (0, repositories_1.getNotificationRepository)();
        const createResult = await notificationRepository.create({
            userId,
            type,
            message,
        });
        if ((0, result_1.isFailure)(createResult)) {
            return server_1.NextResponse.json({ error: createResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ notification: createResult.data }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating notification:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// DELETE /api/notifications - Delete notifications
async function DELETE(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get("id");
        const deleteAllRead = searchParams.get("deleteAllRead") === "true";
        const notificationRepository = (0, repositories_1.getNotificationRepository)();
        if (notificationId) {
            await notificationRepository.delete(notificationId);
        }
        else if (deleteAllRead) {
            await notificationRepository.deleteRead(session.user.id);
        }
        return server_1.NextResponse.json({ message: "Notifications deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting notifications:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
