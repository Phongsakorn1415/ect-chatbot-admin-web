'use client'

import React from 'react'
import { Box, Divider, Grid, Paper } from '@mui/material'

const HomePage = () => {
  return (
    <>
      <Grid container sx={{ height: '100vh', width: '100vw', bgcolor: '#f5f5f5', pt: 8 }}>
        <Grid size={{ xs: 0, md: 1, lg: 2 }}></Grid>
        <Grid size={{ xs: 12, md: 10, lg: 8 }} sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
          <Paper elevation={1} sx={{ width: '100%' }}>
            <Box sx={{ m: 2 }}>
              Chat with ai
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              Content
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 0, md: 1, lg: 2 }}></Grid>
      </Grid>
    </>
  )
}

export default HomePage
