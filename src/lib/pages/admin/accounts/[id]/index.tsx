'use client'

import React, {useEffect} from 'react'
import { useParams } from 'next/navigation'

import ProfileCard from '@/lib/components/pageComponent/account[id]/profileCard'
import InfoCard from '@/lib/components/pageComponent/account[id]/infoCard'

import { Box, Typography } from '@mui/material';
import useBreakPointResolution from '@/lib/services/BreakPointResolusion';

import { ContactInfo } from '@/lib/types/contact';

const AccountPage = () => {
    const { isMobile, isTablet, isDesktop } = useBreakPointResolution();

    const { id } = useParams<{ id: string }>();
    const [accountData, setAccountData] = React.useState<any>(null);
    const [contactData, setContactData] = React.useState<ContactInfo[] | null>(null);

    // true = loading, false = finished
    const [isAccountDataLoaded, setIsAccountDataLoaded] = React.useState(true);
    const [isContactDataLoaded, setIsContactDataLoaded] = React.useState(true);

    // Fetch account data based on ID
    useEffect(() => {
        let cancelled = false;
        const fetchAccountData = async () => {
            setIsAccountDataLoaded(true);
            try {
                const response = await fetch(`/api/accounts/${id}`);
                if (cancelled) return;
                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched account data:', data);
                    setAccountData(data.data ?? null);
                } else {
                    // If not OK (e.g., 404), ensure data is null so UI can show Not Found after loading
                    setAccountData(null);
                    console.error('Failed to fetch account data');
                }
            } catch (error) {
                if (!cancelled) {
                    setAccountData(null);
                    console.error('Error fetching account data:', error);
                }
            } finally {
                if (!cancelled) setIsAccountDataLoaded(false);
            }
        };
        fetchAccountData();

        // cleanup to avoid state updates after unmount or id change
        return () => {
            cancelled = true;
        };
    }, [id]);

    // Fetch contact info for this account
    useEffect(() => {
        let cancelled = false;
        const fetchContactData = async () => {
            setIsContactDataLoaded(true);
            try {
                const response = await fetch(`/api/accounts/${id}/contact`);
                if (cancelled) return;
                if (response.ok) {
                    const data = await response.json();
                    // API returns an array with shape { id, contact_detail, contact_type }
                    const mapped: ContactInfo[] = (Array.isArray(data) ? data : []).map((c: any) => ({
                        id: c.id,
                        value: c.contact_detail,
                        contact_type: c.contact_type,
                    }));
                    console.log('Fetched contact data:', mapped);
                    setContactData(mapped);
                } else {
                    setContactData([]);
                    console.error('Failed to fetch contact data');
                }
            } catch (error) {
                if (!cancelled) {
                    setContactData([]);
                    console.error('Error fetching contact data:', error);
                }
            } finally {
                if (!cancelled) setIsContactDataLoaded(false);
            }
        };
        fetchContactData();

        return () => {
            cancelled = true;
        };
    }, [id]);

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
                    userRole={accountData?.role}
                    contactData={contactData ?? []}
                />
            </Box>
        </>
    )
}
export default AccountPage