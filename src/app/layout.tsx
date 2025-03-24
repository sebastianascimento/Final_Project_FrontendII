'use client';

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import "../styles/globals.css";
import { ReduxProvider } from "./providers/ReduxProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}