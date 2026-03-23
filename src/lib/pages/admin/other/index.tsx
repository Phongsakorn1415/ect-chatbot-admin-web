'use client'

import React, { useState } from 'react'
import { Box, Typography, Paper, Button, Grid, Divider, CircularProgress, Snackbar, Alert } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useRouter } from 'next/navigation';

const OtherPage = () => {
  const router = useRouter();
  const [isEmbeddingHandling, setIsEmbeddingHandling] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleGenerateEmbedding = async () => {
    setIsEmbeddingHandling(true);
    try {
      const res = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Trigger all if no id is provided based on the API
      });

      if (res.ok) {
        setSnackbarSeverity('success');
        setSnackbarMessage('เริ่มกระบวนการสร้าง Embedding ใหม่สำเร็จแล้ว');
      } else {
        setSnackbarSeverity('error');
        setSnackbarMessage('เกิดข้อผิดพลาดในการสร้าง Embedding ใหม่');
      }
    } catch (e) {
      setSnackbarSeverity('error');
      setSnackbarMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsEmbeddingHandling(false);
    }
  };

  const menuItems = [
    {
      title: 'สร้าง Embedding ใหม่',
      description: 'ปรับปรุงฐานข้อมูล Embedding ของระบบ AI สำหรับรายวิชาและผู้ใช้งาน ในกรณีที่เกิดข้อผิดพลาดตอนเพิ่มข้อมูล',
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      actionText: 'เริ่มทำงาน',
      action: handleGenerateEmbedding,
      loading: isEmbeddingHandling
    },
    {
      title: 'แชทที่มีการแจ้งปัญหา',
      description: 'เรียกดูประวัติการสนทนาของแชทบอททั้งหมดที่มีการแจ้งปัญหาเข้ามา',
      icon: <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      actionText: 'เรียกดู',
      action: () => router.push('/admin/other/reported-chat'),
      loading: false
    }
  ];

  return (
    <>
      <Box sx={{ m: { xs: 1, md: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom>
          จัดการระบบ
        </Typography>
        <Grid container spacing={3}>
          {menuItems.map((item, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {item.icon}
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {item.title}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3 }}>
                  {item.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={item.action}
                  disabled={item.loading}
                  startIcon={item.loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {item.loading ? 'กำลังทำงาน...' : item.actionText}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarMessage('')} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default OtherPage
