"use client";

import NavBar from "@/lib/components/NavBar";
import React, { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import MainTheme from "@/lib/styles/MainStyle";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <>
      <ThemeProvider theme={MainTheme}>
        <NavBar />
        {children}
      </ThemeProvider>
    </>
  );
};

export default MainLayout;
