import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getUserRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production"

export async function POST(request: Request) {
  try {
    const bodyText = await request.text()

    let email: string, password: string

    try {
      const body = JSON.parse(bodyText)
      email = body.email
      password = body.password
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const userRepository = getUserRepository()
    const userResult = await userRepository.findByEmail(email)

    if (isFailure(userResult)) {
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      )
    }

    if (!userResult.data) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const user = userResult.data

    // Verify password
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      }
    }

    // Generate JWT token for session
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    }

    const token = jwt.sign(payload, JWT_SECRET)

    // Return the token in a custom header (not a cookie)
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })

    response.headers.set("X-Session-Token", token)

    return response
  } catch (error) {
    console.error("Test login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
