import MainTheme from '@/lib/styles/MainStyle'
import { AppBar, Box, Button, Grid } from '@mui/material'
import React from 'react'

const NavBar = () => {
  return (
    <>
        <AppBar position="fixed" sx={{ zIndex: MainTheme.zIndex.drawer + 1, bgcolor: 'white', color: MainTheme.palette.text.primary, padding: 2, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ fontSize: 20, fontWeight: 'bold' }}>
                ECTChatbot
            </Box>
            <Button variant="contained" color="secondary" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                admin tool
            </Button>
        </AppBar>
    </>
  )
}

export default NavBar
