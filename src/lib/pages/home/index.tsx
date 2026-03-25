'use client'

import React, { useEffect, useState } from 'react'
import { Grid } from '@mui/material'
import ChatBoxCard from '@/lib/components/ChatBox/Card'
import SessionExpiredModal from '@/lib/components/sessionExpiredModal'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const HomePage = () => {
  const router = useRouter()
  const searchParams = useSearchParams();
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // useEffect(() => {
  //   if (session) router.replace('admin')
  // }), [session, status]

  // if (status === 'loading') return null

  useEffect(() => {
    // เช็คทั้งจาก searchParams ของ Next.js และจาก window.location โดยตรงเพื่อความชัวร์
    const isExpired = searchParams.get('session') === 'expired' || 
                      (typeof window !== 'undefined' && window.location.search.includes('session=expired'));

    if (isExpired) {
      setShowExpiredModal(true);

      // 2. ลบ Parameter ออกจาก URL ทันทีเพื่อให้เวลา Refresh แล้วแจ้งเตือนไม่เด้งซ้ำ
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams])

  const handleCloseModal = () => {
    setShowExpiredModal(false);
  };

  return (
    <>
      <Grid container sx={{ alignItems: 'center', height: '80vh' }}>
        <Grid size={{ xs: 0, md: 1, lg: 2 }}></Grid>
        <Grid size={{ xs: 12, md: 10, lg: 8 }} sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', maxHeight: '70vh', px: { xs: 1, md: 0 } }}>
          <ChatBoxCard />
        </Grid>
        <Grid size={{ xs: 0, md: 1, lg: 2 }}></Grid>
      </Grid>

      <SessionExpiredModal open={showExpiredModal} onClose={handleCloseModal} />
    </>
  )
}

export default HomePage
