"use client";

import React, { ReactNode } from "react";
import AuthProvider from "@/lib/layouts/AuthProviders";
import ThemeRegistry from "@/lib/styles/ThemeRegistry";
import NavBar from "@/lib/components/NavBar";
import { Toolbar } from "@mui/material";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";

interface MainLayoutProps {
  children: ReactNode;
  session: Session | null;
}

const MainLayout = ({ children, session }: MainLayoutProps) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <AuthProvider session={session}>
      <ThemeRegistry>
        {!isAdminRoute && (
          <>
            <NavBar HandleDrawerToggle={() => { }} />
            <Toolbar />
          </>
        )}
        {children}
      </ThemeRegistry>
    </AuthProvider>
  );
};

export default MainLayout;
