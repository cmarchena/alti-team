"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const repositories_1 = require("./repositories");
// Helper function to create notifications from other parts of the app
async function createNotification(userId, type, message) {
    try {
        const notificationRepository = (0, repositories_1.getNotificationRepository)();
        await notificationRepository.create({
            userId,
            type,
            message,
        });
    }
    catch (error) {
        console.error("Error creating notification:", error);
    }
}
