'use client'

import React, {useEffect} from 'react'
import { useParams } from 'next/navigation'

import ProfileCard from '@/lib/components/pageComponent/account[id]/profileCard'

import { Box, Typography } from '@mui/material';
import useBreakPointResolution from '@/lib/services/BreakPointResolusion';

import PersonOffIcon from '@mui/icons-material/PersonOff';

const AccountPage = () => {
    const { isMobile, isTablet, isDesktop } = useBreakPointResolution();

    const { id } = useParams<{ id: string }>();
    const [accountData, setAccountData] = React.useState<any>(null);

    // true = loading, false = finished
    const [isAccountDataLoaded, setIsAccountDataLoaded] = React.useState(true);

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

    return (
        <>
            <Box sx={{ m: { xs: 1, md: 3 } }}>

                <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                    ข้อมูลบัญชีผู้ใช้
                </Typography>
                <ProfileCard
                    accountData={accountData}
                    isAccountDataLoaded={isAccountDataLoaded}
                    onSaved={(updated) => setAccountData(updated)}
                />
            </Box>
        </>
    )
}
export default AccountPage