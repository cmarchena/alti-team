import { getNotificationRepository } from "./repositories"

// Helper function to create notifications from other parts of the app
export async function createNotification(
  userId: string,
  type: string,
  message: string
) {
  try {
    const notificationRepository = getNotificationRepository()
    await notificationRepository.create({
      userId,
      type,
      message,
    })
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}
