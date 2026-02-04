import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

// GET /api/users/me - Get current user profile
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRepository = getUserRepository()
    const userResult = await userRepository.findById(session.user.id)

    if (isFailure(userResult)) {
      return NextResponse.json({ error: userResult.error.message }, { status: 500 })
    }

    if (!userResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user without sensitive data
    return NextResponse.json({
      user: {
        id: userResult.data.id,
        name: userResult.data.name,
        email: userResult.data.email,
        createdAt: userResult.data.createdAt,
      }
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    const userRepository = getUserRepository()
    const updateResult = await userRepository.update(session.user.id, {
      name: name ?? undefined,
    })

    if (isFailure(updateResult)) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: updateResult.data.id,
        name: updateResult.data.name,
        email: updateResult.data.email,
      }
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
