import { Box, Drawer, Paper } from '@mui/material'
import React from 'react'
import useBreakPointResolution from '@/lib/services/BreakPointResolusion'
import { useSession } from 'next-auth/react'

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

  const DrawerContent = () => (
    <>      
      <Box> Drawer Content </Box>
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
            <DrawerContent />
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
