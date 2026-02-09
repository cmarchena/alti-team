"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
async function POST(request) {
    try {
        const { name, email, password } = await request.json();
        // Validate input
        if (!name || !email || !password) {
            return server_1.NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
        }
        const userRepository = (0, repositories_1.getUserRepository)();
        // Check if user already exists
        const existingUserResult = await userRepository.findByEmail(email);
        if ((0, result_1.isFailure)(existingUserResult)) {
            return server_1.NextResponse.json({ error: existingUserResult.error.message }, { status: 500 });
        }
        if (existingUserResult.data) {
            return server_1.NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const createUserResult = await userRepository.create({
            name,
            email,
            password: hashedPassword,
        });
        if ((0, result_1.isFailure)(createUserResult)) {
            return server_1.NextResponse.json({ error: createUserResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({
            message: "User created successfully",
            user: {
                id: createUserResult.data.id,
                email: createUserResult.data.email,
                name: createUserResult.data.name
            }
        }, { status: 201 });
    }
    catch (error) {
        console.error("Registration error:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
