"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = void 0;
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
const repositories_1 = require("./repositories");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const result_1 = require("./result");
exports.authOptions = {
    providers: [
        (0, credentials_1.default)({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const userRepository = (0, repositories_1.getUserRepository)();
                const userResult = await userRepository.findByEmail(credentials.email);
                if ((0, result_1.isFailure)(userResult) || !userResult.data) {
                    return null;
                }
                const user = userResult.data;
                // Check if user has a password (registered via signup) or use demo mode
                if (user.password) {
                    const isPasswordValid = await bcryptjs_1.default.compare(credentials.password, user.password);
                    if (!isPasswordValid)
                        return null;
                }
                else {
                    // Demo mode: accept any password for users without hashed password
                    // (created via seed or manual database entry)
                }
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
            }
            return session;
        },
    },
};
