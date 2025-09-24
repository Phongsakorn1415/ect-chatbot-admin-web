"use client";

import NavBar from "@/lib/components/NavBar";
import React, { ReactNode } from "react";
import AuthProvider from "@/lib/layouts/AuthProviders";
import { ThemeProvider } from "@mui/material/styles";
import MainTheme from "@/lib/styles/MainStyle";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <>
      <AuthProvider>
        <ThemeProvider theme={MainTheme}>
          <NavBar />
          {children}
        </ThemeProvider>
      </AuthProvider>
    </>
  );
};

export default MainLayout;
