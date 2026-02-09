"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const middleware_1 = require("next-auth/middleware");
exports.default = (0, middleware_1.withAuth)(function middleware(req) {
    // Add custom middleware logic here if needed
}, {
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});
exports.config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth).*)"],
};
