"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
require("./globals.css");
const SessionProvider_1 = require("./components/SessionProvider");
exports.metadata = {
    title: 'Alti Team',
    description: 'Team management application',
};
function RootLayout({ children, }) {
    return (<html lang="en">
      <body className="font-sans">
        <SessionProvider_1.SessionProvider>
          {children}
        </SessionProvider_1.SessionProvider>
      </body>
    </html>);
}
