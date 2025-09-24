'use client'

import React from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { IUser } from '@/lib/types/user'
import { useContext } from 'react'

const AdminHomepage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  console.log('Admin session:', session)

  const user = session?.user as IUser | undefined

  const handleSignOut = async () => {
    // Prevent next-auth from performing its own redirect so we can control navigation
    // and avoid a race where middleware or session checks redirect back to /admin.
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <>
      <h1>Admin Page</h1>
      <p>Signed in as: {user?.title} {user?.firstName} {user?.lastName}</p>
      <p>Role: {user?.role ?? 'unknown'}</p>
      <Button variant="contained" color="primary" onClick={handleSignOut}>
        Sign Out
      </Button>
    </>
  )
}

export default AdminHomepage
