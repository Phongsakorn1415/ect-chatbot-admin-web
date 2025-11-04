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

    const [isAccountDataLoaded, setIsAccountDataLoaded] = React.useState(true);

    // Fetch account data based on ID
    useEffect(() => {
        setIsAccountDataLoaded(true);
        const fetchAccountData = async () => {
            try {
                const response = await fetch(`/api/accounts/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched account data:', data);
                    setAccountData(data.data);
                } else {
                    console.error('Failed to fetch account data');
                }
            } catch (error) {
                console.error('Error fetching account data:', error);
            }
        };
        fetchAccountData();
        setIsAccountDataLoaded(false);
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