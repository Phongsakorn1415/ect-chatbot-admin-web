'use client'

import React, { useEffect } from 'react'
import { Box, Button, Grid, Tab, Tabs, Typography } from '@mui/material'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';

import useBreakPointResolution from '@/lib/services/BreakPointResolusion'

import AccountsTable from '@/lib/components/pageComponent/accounts/accountsTable'
import { TableAccountProps } from '@/lib/types/accounts';
import InviteModal from '@/lib/components/pageComponent/accounts/inviteModal'
import CustomAlert from '@/lib/components/customAlert'

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}


const AccountsPage = () => {
  const isMobile = useBreakPointResolution()
  const [tab, setTab] = React.useState(0);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    message: string;
    severity: 'error' | 'warning' | 'info' | 'success';
  } | null>(null);

  const [accountsData, setAccountsData] = React.useState<TableAccountProps[]>([]);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/accounts');
        const data = await response.json();
        console.log(data);
        setAccountsData(data);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(t);
  }, [alert]);

  return (
    <>
      <Box sx={{ p: {xs: 1, md: 3} }}>
        <Box sx={{ display: { xs: 'block', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">จัดการบัญชี</Typography>
          <Button
            variant="contained"
            size='large'
            color="primary"
            sx={{ gap: 1 }}
            onClick={() => setInviteOpen(true)}
          >
            <MailOutlineRoundedIcon /> เพิ่มบัญชี
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={handleChangeTab} aria-label="basic tabs example">
            <Tab label="บัญชีทั้งหมด" {...a11yProps(0)} />
            <Tab label="การเชิญทั้งหมด" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={tab} index={0}>
          <AccountsTable 
            data={accountsData}
          />
        </CustomTabPanel>
        <CustomTabPanel value={tab} index={1}>
          Item Two
        </CustomTabPanel>
      </Box>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => {
          // switch to the invites tab on success
          setTab(1);
        }}
        onNotify={(message, severity) => setAlert({ message, severity })}
      />

      {alert && (
        <CustomAlert message={alert.message} severity={alert.severity} />
      )}
    </>
  )
}

export default AccountsPage
