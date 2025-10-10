"use client"
import MainTheme from '@/lib/styles/MainStyle'
import { AppBar, Box, Button, Grid, IconButton, Toolbar } from '@mui/material'
import React, { useState } from 'react'
import LoginModal from '../LoginModal'
import { useSession } from 'next-auth/react'
import useBreakPointResolution from '@/lib/services/BreakPointResolusion'
import MenuIcon from '@mui/icons-material/Menu';

interface NavBarProps {
  HandleDrawerToggle: () => void;
}

const NavBar = ({ HandleDrawerToggle }: NavBarProps) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { data: session, status } = useSession()
  const getBreakPoint = useBreakPointResolution();

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: MainTheme.zIndex.drawer + 1,
          bgcolor: 'white',
          color: MainTheme.palette.text.primary,
          boxShadow: 1
        }}
      >
        <Toolbar sx={{ minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {(getBreakPoint.isMobile || getBreakPoint.isTablet) && session && (
              <IconButton size='small' sx={{ mr: 2 }} onClick={HandleDrawerToggle}>
                <MenuIcon />
              </IconButton>
            )}
            <Box component="span" sx={{ fontSize: 20, fontWeight: 'bold' }}>ECTChatbot</Box>
          </Box>
          {!session && status !== 'loading' && (
            <Button
              variant="contained"
              color="secondary"
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
              onClick={handleOpenLoginModal}
            >
              admin tool
            </Button>
          )}
        </Toolbar>
      </AppBar>
      { status !== 'loading' && !session && (
      <LoginModal
        open={isLoginModalOpen}
        onClose={handleCloseLoginModal}
      />
      )}
    </>
  )
}

export default NavBar
