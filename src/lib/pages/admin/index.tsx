'use client'

import React, { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Button, Grid } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { IUser } from '@/lib/types/user'
import { useContext } from 'react'
import { stat } from 'fs'
import MenuDrawer from '@/lib/components/pageComponent/courses/MenuDrawer'

import ChatBoxFull from '@/lib/components/ChatBox/Full'

const AdminHomepage = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  console.log('Admin session:', session)

  const user = session?.user as IUser | undefined

  return (
    <>
      <Grid container sx={{ height: 'calc(100dvh - 100px)' }}>
        <Grid size={{ xs: 12, lg: 12 }} sx={{ height: '100%', width: '100%', p: 2 }}>
          <ChatBoxFull />
        </Grid>
      </Grid>

    </>
  )
}

export default AdminHomepage
