"use client";

import NavBar from "@/lib/components/NavBar";
import React, { ReactNode } from "react";
import AuthProvider from "@/lib/layouts/AuthProviders";
import { ThemeProvider } from "@mui/material/styles";
import { Toolbar } from "@mui/material";
import MainTheme from "@/lib/styles/MainStyle";
import ThemeRegistry from "@/lib/styles/ThemeRegistry";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  

  return (
    <>
      <AuthProvider>
        <ThemeRegistry>
          <NavBar />
          <Toolbar />
          {children}
        </ThemeRegistry>
      </AuthProvider>
    </>
  );
};

export default MainLayout;
