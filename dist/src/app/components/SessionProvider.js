"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionProvider = SessionProvider;
const react_1 = require("next-auth/react");
function SessionProvider({ children }) {
    return (<react_1.SessionProvider>
      {children}
    </react_1.SessionProvider>);
}
