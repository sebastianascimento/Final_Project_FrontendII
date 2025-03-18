'use client';

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import "../styles/globals.css";
import { Metadata } from "next";


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="eng">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}