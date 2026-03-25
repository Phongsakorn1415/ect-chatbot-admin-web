"use client";
import React, { useEffect } from 'react';
import { Toolbar, Grid } from '@mui/material';
import NavBar from '@/lib/components/NavBar';
import MainDrawer from '@/lib/components/MainDrawer';
import { DrawerProvider, useDrawer } from '@/lib/contexts/DrawerContext';

const AdminLayoutInner = ({ children, wasLoggedInMaxAge }: { children: React.ReactNode, wasLoggedInMaxAge: number }) => {
  const drawer = useDrawer();

  useEffect(() => {
    // เซ็ตคุ้กกี้เพื่อบอกว่า "เคย Login แล้ว" โดยมีอายุคุ้มครองตามที่แผนระบุ (JWT + 1 วัน)
    document.cookie = `was-logged-in=true; path=/; max-age=${wasLoggedInMaxAge}`;
  }, [wasLoggedInMaxAge]);

  if (!drawer) return null;
  const { isOpen, toggle, close, handleTransitionEnd } = drawer;

  return (
    <>
      <NavBar HandleDrawerToggle={toggle} />
      <Toolbar />
      <Grid container spacing={0} sx={{ width: '100%', margin: 0 }}>
        <Grid size={{ xs: 0, md: 3.5, lg: 2.5, xl: 2 }} sx={{ display: { xs: 'none', md: 'block', lg: 'block' } }}>
          <MainDrawer
            isOpen={isOpen}
            HandleDrawerClose={close}
            handleDrawerTransitionEnd={handleTransitionEnd}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8.5, lg: 9.5, xl: 10 }} sx={{ height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {children}
        </Grid>
      </Grid>
    </>
  );
};

const AdminLayout = ({ children, wasLoggedInMaxAge }: { children: React.ReactNode, wasLoggedInMaxAge: number }) => {
  return (
    <DrawerProvider>
      <AdminLayoutInner wasLoggedInMaxAge={wasLoggedInMaxAge}>{children}</AdminLayoutInner>
    </DrawerProvider>
  );
};

export default AdminLayout;
