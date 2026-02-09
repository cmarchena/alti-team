"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production";
async function POST(request) {
    try {
        const bodyText = await request.text();
        let email, password;
        try {
            const body = JSON.parse(bodyText);
            email = body.email;
            password = body.password;
        }
        catch {
            return server_1.NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
        }
        if (!email || !password) {
            return server_1.NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }
        const userRepository = (0, repositories_1.getUserRepository)();
        const userResult = await userRepository.findByEmail(email);
        if ((0, result_1.isFailure)(userResult)) {
            return server_1.NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
        }
        if (!userResult.data) {
            return server_1.NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        const user = userResult.data;
        // Verify password
        if (user.password) {
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                return server_1.NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
            }
        }
        // Generate JWT token for session
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        // Return the token in a custom header (not a cookie)
        const response = server_1.NextResponse.json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
        response.headers.set("X-Session-Token", token);
        return response;
    }
    catch (error) {
        console.error("Test login error:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
