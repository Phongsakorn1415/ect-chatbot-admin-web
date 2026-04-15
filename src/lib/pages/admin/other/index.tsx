'use client'

import React, { useState, useEffect } from 'react'
import { Box, Typography, Paper, Button, Grid, Divider, CircularProgress } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useRouter } from 'next/navigation';
import CardMenu from '@/lib/components/pageComponent/other/cardMenu';
import CustomAlert from '@/lib/components/customAlert';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';

import ManageContactType from '@/lib/components/pageComponent/other/manageConatactType';

const OtherPage = () => {
  const router = useRouter();
  const [isEmbeddingHandling, setIsEmbeddingHandling] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const [isApiError, setIsApiError] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [embeddingCount, setEmbeddingCount] = useState(0);
  const [nonEmbeddingData, setNonEmbeddingData] = useState<{
    subject_id: number[];
    teacher_id: number[];
  }>({
    subject_id: [],
    teacher_id: []
  });

  const [openManageContactType, setOpenManageContactType] = useState(false);

  const fetchEmbeddingCount = async () => {
    setIsApiLoading(true);
    setIsApiError(false);
    try {
      const res = await fetch('/api/embed');
      const data = await res.json();

      if (!res.ok || !data.data) {
        setIsApiError(true);
        setEmbeddingCount(0);
        setNonEmbeddingData({ subject_id: [], teacher_id: [] });
      } else {
        setEmbeddingCount(data.count ?? 0);
        setNonEmbeddingData(data.data);
      }
      console.log(data);
    } catch (e) {
      setIsApiError(true);
      setEmbeddingCount(0);
      setNonEmbeddingData({ subject_id: [], teacher_id: [] });
    } finally {
      setIsApiLoading(false);
    }
  };

  useEffect(() => {
    fetchEmbeddingCount();
  }, []);

  useEffect(() => {
    if (snackbarMessage) {
      const timer = setTimeout(() => {
        setSnackbarMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbarMessage]);

  const handleGenerateEmbedding = async () => {
    setIsEmbeddingHandling(true);
    try {
      const res = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nonEmbeddingData)
      });

      if (res.ok) {
        setSnackbarSeverity('success');
        setSnackbarMessage('เริ่มกระบวนการสร้าง Embedding ใหม่สำเร็จแล้ว');
        await fetchEmbeddingCount();
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
      description: <>
        <Typography variant='body1' color='text.primary' sx={{ fontWeight: 'bold' }}>จำนวนชื่อที่ยังไม่ได้สร้าง Embedding: {isApiLoading ? '—' : embeddingCount}</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>ปรับปรุงฐานข้อมูล Embedding ของระบบ AI สำหรับรายวิชาและผู้ใช้งาน ในกรณีที่เกิดข้อผิดพลาดและไม่สามารถสร้าง Embedding ได้ตอนเพิ่มข้อมูล</Typography>
      </>,
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      actionText: 'เริ่มทำงาน',
      action: handleGenerateEmbedding,
      loading: isEmbeddingHandling,
      disabled: embeddingCount === 0 || isApiError || isApiLoading,
      overlayState: isApiLoading ? 'loading' as const : isApiError ? 'error' as const : 'none' as const
    },
    {
      title: 'แชทที่มีการแจ้งปัญหา',
      description: 'เรียกดูประวัติการสนทนาของแชทบอททั้งหมดที่มีการแจ้งปัญหาเข้ามา',
      icon: <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      actionText: 'เรียกดู',
      action: () => router.push('/admin/other/reported-chat'),
      loading: false,
      disabled: false
    },
    {
      title: 'จัดการประเภทข้อมูลของช่องทางการติดต่อ',
      description: 'จัดการประเภทข้อมูลของช่องทางการติดต่อ',
      icon: <ConnectWithoutContactIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      actionText: 'จัดการ',
      action: () => setOpenManageContactType(true),
      loading: false,
      disabled: false
    }
  ];

  return (
    <>
      <Box sx={{ m: { xs: 1, md: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom>
          จัดการระบบ
        </Typography>
        <CardMenu menuItems={menuItems} />
      </Box>

      {!!snackbarMessage && (
        <CustomAlert message={snackbarMessage} severity={snackbarSeverity} />
      )}

      <ManageContactType open={openManageContactType} onClose={() => setOpenManageContactType(false)} />
    </>
  )
}

export default OtherPage
