import { Box, Button, Drawer, IconButton, Link, Paper, Typography } from '@mui/material'
import React from 'react'
import useBreakPointResolution from '@/lib/services/BreakPointResolusion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

interface MainDrawerProps {
  isOpen: boolean;
  HandleDrawerClose: () => void;
  handleDrawerTransitionEnd: () => void;
}

const MainDrawer = ({ isOpen, HandleDrawerClose, handleDrawerTransitionEnd }: MainDrawerProps) => {
  const { isMobile, isTablet } = useBreakPointResolution()
  const { data: session } = useSession()

  // ถ้าไม่มี session ไม่ต้องแสดง Drawer
  if (!session) return null

  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const DrawerContent = () => (
    <>
      <Box gap={2}>
        <Paper elevation={0} sx={{ mb: 2, display: { xs: 'block', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
          <Paper elevation={0} sx={{ padding: 0.5, width: '100%', display: { xs: 'block', sm: 'flex' }, alignItems: 'center', ':hover': { bgcolor: 'action.hover', cursor: 'pointer' } }} onClick={() => router.push('/profile')}>
            <AccountCircleRoundedIcon sx={{ fontSize: 40, color: 'gray' }} />
            <Box sx={{ ml: { xs: 0, sm: 2 } }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>{session.user?.firstName} {session.user?.lastName} </Typography>
              <Typography variant='body2' sx={{ color: 'gray' }}> {session.user?.role} </Typography>
            </Box>
          </Paper>
          <Button variant={isMobile ? 'outlined' : 'text'} fullWidth={isMobile} color='error' onClick={handleSignOut} sx={{ ml: 'auto', mt: { xs: 1, sm: 0 } }}>
            <LogoutRoundedIcon fontSize='medium' />  {isMobile ? <Typography variant='body2' sx={{ ml: 1 }}>ออกจากระบบ</Typography> : null}
          </Button>
        </Paper>
        <Paper elevation={0} sx={{ ':hover': { bgcolor: 'action.hover', cursor: 'pointer' }, p: 1, borderRadius: 1 }} onClick={() => router.push('/courses')}>หลักสูตร</Paper>
        {session.user?.role == 'SUPER_ADMIN' && (
          <Paper elevation={0} sx={{ ':hover': { bgcolor: 'action.hover', cursor: 'pointer' }, p: 1, borderRadius: 1 }} onClick={() => router.push('/accounts')}>บัญชีทั้งหมด</Paper>
        )}
        {/* <Link href='/profile' variant='body1' sx={{ textDecoration: 'none', color: 'text.primary', width: '100%', bgcolor: 'background.default' }}>หลักสูตร</Link> */}
      </Box>
    </>
  )

  return (
    <>
      {(isMobile || isTablet) ? (
        <Drawer
          variant='temporary'
          anchor='left'
          open={isOpen}
          onClose={HandleDrawerClose}
          onTransitionEnd={handleDrawerTransitionEnd}
        >
          <Box sx={{ height: '100%', width: '50vw', paddingTop: '64px' }}>
            <Box sx={{ padding: 2, overflowY: 'auto', overflowX: 'hidden' }}>
              <DrawerContent />
            </Box>
          </Box>
        </Drawer>
      ) : (
        <Paper
          square
          elevation={10}
          sx={{
            width: '100%',
            boxSizing: 'border-box',
            // Height minus AppBar (Toolbar) height to avoid vertical overflow
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: 64,
            p: 2,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <DrawerContent />
        </Paper>
      )}
    </>
  )
}

export default MainDrawer
