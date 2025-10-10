'use client'

import { Box, IconButton, Typography } from '@mui/material'
import React from 'react'
import ListIcon from '@mui/icons-material/List';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import getBrackPointResolution from '@/lib/services/BreakPointResolusion';
import MenuDrawer from '@/lib/components/MenuDrawer';
import { DrawerMenuItem } from "@/lib/types/PageDrawer";

const drawerWidth = 240;

const CoursesPage = () => {
  const { isMobile, isTablet } = getBrackPointResolution()

  const drawerItems: DrawerMenuItem[] = [
    { id: '1', title: 'หลักสูตรปี 2565', children: [
      { id: '1-1', title: 'หมวดวิชาพื้นฐาน' },
      { id: '1-2', title: 'หมวดวิชาเฉพาะ' },
      { id: '1-3', title: 'หมวดวิชาเลือกเสรี' },
    ] },
    { id: '2', title: 'หลักสูตรปี 2569' },
    { id: '3', title: 'หลักสูตรปี 2573', children: [
      { id: '3-1', title: 'ร่างฉบับ A', onClick: () => alert('Clicked 3-1') },
      { id: '3-2', title: 'ร่างฉบับ B', onClick: () => alert('Clicked 3-2') },
    ],
    onClick() {
      alert('Clicked 2573');
    },
   },
    { id: '4', title: 'หลักสูตรปี 2577' },
    { id: '5', title: 'หลักสูตรปี 2581' },
  ];

  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  return (
    <Box sx={{ display: 'flex', width: '100%', gap: 0 }}>
      {/* Page-scoped drawer at the left within this page area */}
      <MenuDrawer isOpen={open} drawerWidth={drawerWidth} items={drawerItems} />

      {/* Page content sits to the right and naturally takes remaining space */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='large' color='inherit' sx={{ mr: 1 }} onClick={open ? handleDrawerClose : handleDrawerOpen}>
            {open ? <MenuOpenIcon /> : <ListIcon />}
          </IconButton>
          จัดการหลักสูตร
        </Typography>
        {/* TODO: page content here */}
      </Box>
    </Box>
  )
}

export default CoursesPage
