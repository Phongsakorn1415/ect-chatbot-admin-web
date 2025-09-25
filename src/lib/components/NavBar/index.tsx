"use client"
import MainTheme from '@/lib/styles/MainStyle'
import { AppBar, Box, Button, Grid, IconButton } from '@mui/material'
import React, { useState } from 'react'
import LoginModal from '../LoginModal'
import { useSession } from 'next-auth/react'
import useBreakPointResolution from '@/lib/services/BreakPointResolusion'
import MenuIcon from '@mui/icons-material/Menu';

const NavBar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { data: session } = useSession()
  const getBreakPoint = useBreakPointResolution();

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: MainTheme.zIndex.drawer + 1, bgcolor: 'white', color: MainTheme.palette.text.primary, padding: 2, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getBreakPoint.isMobile && session && (
            <IconButton size='small'  sx={{ mr: 2 }}><MenuIcon /></IconButton>
          )}
          <Box component="span" sx={{ fontSize: 20, fontWeight: 'bold' }}>ECTChatbot</Box>
        </Box>
        {!session && (
          <Button
            variant="contained"
            color="secondary"
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
            onClick={handleOpenLoginModal}
          >
            admin tool
          </Button>
        )}
      </AppBar>
      { !session && (
      <LoginModal
        open={isLoginModalOpen}
        onClose={handleCloseLoginModal}
      />
      )}
    </>
  )
}

export default NavBar
