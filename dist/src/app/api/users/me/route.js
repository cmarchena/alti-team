"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
const server_1 = require("next/server");
const repositories_1 = require("@/lib/repositories");
const result_1 = require("@/lib/result");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production";
async function validateToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch {
        return null;
    }
}
// GET /api/users/me - Get current user profile
async function GET(request) {
    try {
        const user = await validateToken(request.headers.get("authorization"));
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userRepository = (0, repositories_1.getUserRepository)();
        const userResult = await userRepository.findById(user.sub);
        if ((0, result_1.isFailure)(userResult)) {
            return server_1.NextResponse.json({ error: userResult.error.message }, { status: 500 });
        }
        if (!userResult.data) {
            return server_1.NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return server_1.NextResponse.json({
            user: {
                id: userResult.data.id,
                name: userResult.data.name,
                email: userResult.data.email,
                createdAt: userResult.data.createdAt,
            },
        });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
// PATCH /api/users/me - Update current user profile
async function PATCH(request) {
    try {
        const user = await validateToken(request.headers.get("authorization"));
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { name } = await request.json();
        const userRepository = (0, repositories_1.getUserRepository)();
        const updateResult = await userRepository.update(user.sub, {
            name: name ?? undefined,
        });
        if ((0, result_1.isFailure)(updateResult)) {
            return server_1.NextResponse.json({ error: updateResult.error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({
            message: "User updated successfully",
            user: {
                id: updateResult.data.id,
                name: updateResult.data.name,
                email: updateResult.data.email,
            },
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
