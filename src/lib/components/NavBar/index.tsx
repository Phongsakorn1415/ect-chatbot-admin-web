import MainTheme from '@/lib/styles/MainStyle'
import { AppBar, Box, Button, Grid } from '@mui/material'
import React, { useState } from 'react'
import LoginModal from '../LoginModal'

const NavBar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <>
        <AppBar position="fixed" sx={{ zIndex: MainTheme.zIndex.drawer + 1, bgcolor: 'white', color: MainTheme.palette.text.primary, padding: 2, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ fontSize: 20, fontWeight: 'bold' }}>
                ECTChatbot
            </Box>
            <Button 
                variant="contained" 
                color="secondary" 
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                onClick={handleOpenLoginModal}
            >
                admin tool
            </Button>
        </AppBar>
        <LoginModal 
            open={isLoginModalOpen}
            onClose={handleCloseLoginModal}
        />
    </>
  )
}

export default NavBar
