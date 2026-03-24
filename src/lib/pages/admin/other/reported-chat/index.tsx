'use client'

import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const ReportedChatPage = () => {
  return (
    <Box sx={{ m: { xs: 1, md: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        ประวัติการแชท
      </Typography>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="body1" color="text.secondary">
          ตารางแสดงประวัติการแชทจะอยู่ที่นี่...
        </Typography>
      </Paper>
    </Box>
  )
}

export default ReportedChatPage
