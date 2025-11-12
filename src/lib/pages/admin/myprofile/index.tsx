'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'

import ProfileCard from '@/lib/components/pageComponent/account[id]/profileCard'
import InfoCard from '@/lib/components/pageComponent/account[id]/infoCard'
import { ContactInfo } from '@/lib/types/contact'

const MyProfilePage = () => {
  const { data: session, status } = useSession();
  const accountId = session?.user?.id;

  const [accountData, setAccountData] = useState<any>(null);
  const [contactData, setContactData] = useState<ContactInfo[] | null>(null);

  const [isAccountDataLoaded, setIsAccountDataLoaded] = useState(true); // true = loading
  const [isContactDataLoaded, setIsContactDataLoaded] = useState(true); // true = loading

  // Fetch account data for logged-in user
  useEffect(() => {
    if (status !== 'authenticated' || !accountId) return;
    let cancelled = false;
    const run = async () => {
      setIsAccountDataLoaded(true);
      try {
        const res = await fetch(`/api/accounts/${accountId}`);
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          setAccountData(json?.data ?? null);
        } else {
          setAccountData(null);
          console.error('Failed to fetch current account');
        }
      } catch (e) {
        if (!cancelled) {
          setAccountData(null);
          console.error('Error fetching current account:', e);
        }
      } finally {
        if (!cancelled) setIsAccountDataLoaded(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [status, accountId]);

  // Fetch contact info for logged-in user
  useEffect(() => {
    if (status !== 'authenticated' || !accountId) return;
    let cancelled = false;
    const run = async () => {
      setIsContactDataLoaded(true);
      try {
        const res = await fetch(`/api/accounts/${accountId}/contact`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          const mapped: ContactInfo[] = (Array.isArray(data) ? data : []).map((c: any) => ({
            id: c.id,
            value: c.contact_detail,
            contact_type: c.contact_type,
          }));
          setContactData(mapped);
        } else {
          setContactData([]);
          console.error('Failed to fetch contact of current account');
        }
      } catch (e) {
        if (!cancelled) {
          setContactData([]);
          console.error('Error fetching contact of current account:', e);
        }
      } finally {
        if (!cancelled) setIsContactDataLoaded(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [status, accountId]);

  return (
    <>
      <Box sx={{ m: { xs: 1, md: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom>
          ข้อมูลบัญชีผู้ใช้
        </Typography>
        <ProfileCard
          accountData={accountData}
          isAccountDataLoaded={isAccountDataLoaded}
          onSaved={(updated) => setAccountData(updated)}
        />
        <InfoCard
          userRole={accountData?.role ?? session?.user?.role}
          contactData={contactData ?? []}
          accountId={accountId}
        />
      </Box>
    </>
  )
}

export default MyProfilePage