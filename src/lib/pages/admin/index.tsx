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

const AdminHomepage = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  console.log('Admin session:', session)

  const user = session?.user as IUser | undefined

  // useEffect(() => {
  //   if (!session) {
  //     router.replace('/')
  //   }
  // }), [session, status]
  // if (status === 'loading') return null

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <h1>Admin Page</h1>
          <p>Signed in as: {user?.title} {user?.firstName} {user?.lastName}</p>
          <p>Role: {user?.role ?? 'unknown'}</p>
          <Button variant="contained" color="primary" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Grid>
      </Grid>

    </>
  )
}

export default AdminHomepage
