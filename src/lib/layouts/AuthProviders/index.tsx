"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface AuthProviderProps {
    children: React.ReactNode;
    session: Session | null;
}

// Wrap next-auth SessionProvider and inject the server-fetched initial session
const AuthProvider = ({ children, session }: AuthProviderProps) => {
    return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AuthProvider;
