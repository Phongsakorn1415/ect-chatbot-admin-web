'use client'

import React from 'react'
import { Grid } from '@mui/material'
import ChatBox from '@/lib/components/ChatBox'

const HomePage = () => {
  return (
    <>
      <Grid container sx={{ alignItems: 'center', height: '80vh' }}>
        <Grid size={{ xs: 0, md: 1, lg: 2 }}></Grid>
        <Grid size={{ xs: 12, md: 10, lg: 8 }} sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', maxHeight: '70vh', px: { xs: 1, md: 0 } }}>
          <ChatBox />
        </Grid>
        <Grid size={{ xs: 0, md: 1, lg: 2 }}></Grid>
      </Grid>
    </>
  )
}

export default HomePage
