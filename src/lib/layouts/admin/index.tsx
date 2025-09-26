"use client";
import React from 'react';
import { Toolbar, Grid } from '@mui/material';
import NavBar from '@/lib/components/NavBar';
import MainDrawer from '@/lib/components/MainDrawer';
import { DrawerProvider, useDrawer } from '@/lib/context/DrawerContext';

const AdminLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const drawer = useDrawer();
  if (!drawer) return null; // Should never happen
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
        <Grid size={{ xs: 12, md: 8.5, lg: 9.5, xl: 10 }} sx={{ p: 2 }}>
          {children}
        </Grid>
      </Grid>
    </>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DrawerProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </DrawerProvider>
  );
};

export default AdminLayout;
