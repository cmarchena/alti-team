import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getUserRepository } from "@/lib/repositories"
import { isSuccess, isFailure } from "@/lib/result"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      )
    }

    const userRepository = getUserRepository()

    // Check if user already exists
    const existingUserResult = await userRepository.findByEmail(email)
    if (isFailure(existingUserResult)) {
      return NextResponse.json(
        { error: existingUserResult.error.message },
        { status: 500 }
      )
    }

    if (existingUserResult.data) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const createUserResult = await userRepository.create({
      name,
      email,
      password: hashedPassword,
    })

    if (isFailure(createUserResult)) {
      return NextResponse.json(
        { error: createUserResult.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: { 
          id: createUserResult.data.id, 
          email: createUserResult.data.email, 
          name: createUserResult.data.name 
        } 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
