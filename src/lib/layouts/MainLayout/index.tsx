"use client";

import NavBar from "@/lib/components/NavBar";
import React, { ReactNode } from "react";
import AuthProvider from "@/lib/layouts/AuthProviders";
import { ThemeProvider } from "@mui/material/styles";
import { Toolbar } from "@mui/material";
import MainTheme from "@/lib/styles/MainStyle";
import ThemeRegistry from "@/lib/styles/ThemeRegistry";
import MainDrawer from "@/lib/components/MainDrawer";
import { Grid } from "@mui/material";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  return (
    <>
      <AuthProvider>
        <ThemeRegistry>
          <NavBar HandleDrawerToggle={handleDrawerToggle} />
          <Toolbar />
          <Grid container spacing={0} sx={{ width: '100%', margin: 0 }}>
            <Grid size={{ xs: 0, md: 3.5, lg: 2.5, xl: 2 }} sx={{ display: { xs: 'none', md: 'block', lg: 'block' } }}>
              <MainDrawer
                isOpen={mobileOpen}
                HandleDrawerClose={handleDrawerClose}
                handleDrawerTransitionEnd={handleDrawerTransitionEnd}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8.5, lg: 9.5, xl: 10 }} sx={{ p: 2 }}>
              {children}
            </Grid>
          </Grid>
        </ThemeRegistry>
      </AuthProvider>
    </>
  );
};

export default MainLayout;
