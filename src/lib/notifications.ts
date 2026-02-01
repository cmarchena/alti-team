import { PrismaClient } from "@/generated"

const prisma = new PrismaClient()

// Helper function to create notifications from other parts of the app
export async function createNotification(
  userId: string,
  type: string,
  message: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
      },
    })
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}
