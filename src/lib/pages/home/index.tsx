'use client'

import React from 'react'
import { Box, Divider, Grid, Paper } from '@mui/material'

const HomePage = () => {
  return (
    <>
      <Grid container sx={{ height: '100vh', width: '100vw', bgcolor: '#f5f5f5', pt: 8 }}>
        <Grid size={{ xs: 0, md: 2, lg: 3 }}>
          <Paper square elevation={1} sx={{ height: '100%', width: '100%', display: {xs: 'none', md: 'flex'} }}>
            <Box sx={{ p: 2, fontSize: 18, fontWeight: 'bold' }}>แชททั้งหมด</Box>
            <Divider />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8, lg: 6 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 600 }}>
            <Box sx={{ fontSize: 24, fontWeight: 'bold', mb: 2 }}>
              ยินดีต้อนรับสู่ ECTChatbot Admin Tool
            </Box>
            <Box sx={{ fontSize: 16, mb: 2 }}>
              เครื่องมือนี้ช่วยให้ผู้ดูแลระบบสามารถจัดการและปรับแต่งแชทบอทของ ECT ได้อย่างมีประสิทธิภาพ
            </Box>
            <Box sx={{ fontSize: 16 }}>
              กรุณาเข้าสู่ระบบเพื่อเริ่มต้นใช้งานเครื่องมือสำหรับผู้ดูแลระบบ
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 0, md: 2, lg: 3 }}></Grid>
      </Grid>
    </>
  )
}

export default HomePage
