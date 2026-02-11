import { Box, Button, Drawer, IconButton, Link, Paper, Typography, Backdrop, CircularProgress } from '@mui/material'
import React, { useTransition } from 'react'
import useBreakPointResolution from '@/lib/services/BreakPointResolusion'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

interface MainDrawerProps {
  isOpen: boolean;
  HandleDrawerClose: () => void;
  handleDrawerTransitionEnd: () => void;
}

const MainDrawer = ({ isOpen, HandleDrawerClose, handleDrawerTransitionEnd }: MainDrawerProps) => {
  const { isMobile, isTablet } = useBreakPointResolution()
  const { data: session, status } = useSession()

  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()

  if (status === 'loading' || !session) return null

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const handleNavigate = (path: string) => {
    startTransition(() => {
      router.push(path)
    })
    HandleDrawerClose()
  }

  const DrawerContent = () => (
    <>
      <Box gap={2}>
        <Paper elevation={0} sx={{ mb: 2, display: { xs: 'block', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', textAlign: { xs: 'center', sm: 'left' } }}>
          <Paper elevation={isMobile ? 2 : 0} sx={{ borderRadius: 2, padding: 0.5, width: '100%', display: { xs: 'block', sm: 'flex' }, alignItems: { xs: 'center', sm: 'flex-start' }, ':hover': { bgcolor: 'action.hover', cursor: 'pointer' } }} onClick={() => handleNavigate('/admin/myprofile')}>
            <AccountCircleRoundedIcon sx={{ fontSize: 40, color: 'gray' }} />
            <Box sx={{ ml: { xs: 0, sm: 2 } }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>{session.user?.firstName} {session.user?.lastName}</Typography>
              <Typography variant='body2' sx={{ color: 'gray' }}>{session.user?.role}</Typography>
            </Box>
          </Paper>
          <Button variant={isMobile ? 'outlined' : 'text'} fullWidth={isMobile} color='error' onClick={handleSignOut} sx={{ ml: 'auto', mt: { xs: 1, sm: 0 } }}>
            <LogoutRoundedIcon fontSize='medium' />  {isMobile ? <Typography variant='body2' sx={{ ml: 1 }}>ออกจากระบบ</Typography> : null}
          </Button>
        </Paper>
        <Paper elevation={0} sx={{ ':hover': { bgcolor: 'action.hover', cursor: 'pointer' }, p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', bgcolor: pathname === '/admin' ? 'action.selected' : 'inherit' }} onClick={() => handleNavigate('/admin')}>หน้าแรก</Paper>
        <Paper elevation={0} sx={{ ':hover': { bgcolor: 'action.hover', cursor: 'pointer' }, p: 1, borderRadius: 2, bgcolor: pathname.startsWith('/admin/courses') ? 'action.selected' : 'inherit' }} onClick={() => handleNavigate('/admin/courses')}>หลักสูตร</Paper>
        {session.user?.role !== "TEACHER" && (
          <Paper elevation={0} sx={{ ':hover': { bgcolor: 'action.hover', cursor: 'pointer' }, p: 1, borderRadius: 2, bgcolor: pathname.startsWith('/admin/accounts') ? 'action.selected' : 'inherit' }} onClick={() => handleNavigate('/admin/accounts')}>บัญชีทั้งหมด</Paper>
        )}
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
          <Box sx={{ height: '100%', width: { xs: '80vw', sm: '50vw' }, paddingTop: '64px' }}>
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
            zIndex: (theme) => theme.zIndex.drawer + 2,
          }}
        >
          <DrawerContent />
        </Paper>
      )}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isPending}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  )
}

export default MainDrawer
