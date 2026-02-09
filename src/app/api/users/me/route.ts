import { NextResponse } from "next/server"
import { getUserRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production"

interface TestTokenPayload {
  sub: string
  email: string
  name?: string | null
}

async function validateToken(authHeader: string | null): Promise<TestTokenPayload | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TestTokenPayload
    return decoded
  } catch {
    return null
  }
}

// GET /api/users/me - Get current user profile
export async function GET(request: Request) {
  try {
    const user = await validateToken(request.headers.get("authorization"))

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRepository = getUserRepository()
    const userResult = await userRepository.findById(user.sub)

    if (isFailure(userResult)) {
      return NextResponse.json({ error: userResult.error.message }, { status: 500 })
    }

    if (!userResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: userResult.data.id,
        name: userResult.data.name,
        email: userResult.data.email,
        createdAt: userResult.data.createdAt,
      },
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: Request) {
  try {
    const user = await validateToken(request.headers.get("authorization"))

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    const userRepository = getUserRepository()
    const updateResult = await userRepository.update(user.sub, {
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
      },
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
