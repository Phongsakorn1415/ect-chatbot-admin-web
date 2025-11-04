import React from 'react'
import { Box, Button, CircularProgress, Divider, Grid, Paper, TextField, Tooltip, Typography, MenuItem } from '@mui/material'
import { Account } from '@/lib/types/accounts'

import useBreakPointResolution from '@/lib/services/BreakPointResolusion';

import PersonOffIcon from '@mui/icons-material/PersonOff';
import CustomAlert from '@/lib/components/customAlert';

const ProfileCard = ({ accountData, isAccountDataLoaded, onSaved }: { accountData: Account | null; isAccountDataLoaded: boolean; onSaved?: (updated: any) => void }) => {
    const { isMobile, isTablet, isDesktop } = useBreakPointResolution();

    const [iseditMode, setIsEditMode] = React.useState(false);
    const [form, setForm] = React.useState({
        title: '',
        firstName: '',
        lastName: '',
        role: '',
    });
    const [saving, setSaving] = React.useState(false);
    const [alert, setAlert] = React.useState<{ message: string; severity: 'error' | 'warning' | 'info' | 'success' } | null>(null);

    // Sync form with incoming account data when it changes or when entering edit mode
    React.useEffect(() => {
        if (accountData) {
            setForm({
                title: accountData.title ?? '',
                firstName: accountData.firstName ?? '',
                lastName: accountData.lastName ?? '',
                role: accountData.role ?? '',
            });
        }
    }, [accountData, iseditMode]);

    const isDirty = React.useMemo(() => {
        if (!accountData) return false;
        return (
            form.title !== (accountData.title ?? '') ||
            form.firstName !== (accountData.firstName ?? '') ||
            form.lastName !== (accountData.lastName ?? '') ||
            form.role !== (accountData.role ?? '')
        );
    }, [form, accountData]);

    const handleCancel = () => {
        if (accountData) {
            setForm({
                title: accountData.title ?? '',
                firstName: accountData.firstName ?? '',
                lastName: accountData.lastName ?? '',
                role: accountData.role ?? '',
            });
        }
        setIsEditMode(false);
    };

    const handleSaveData = async () => {
        if (!accountData) return;
        if (!confirm('คุณต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่')) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/accounts/${accountData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    role: form.role,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to update user');
            }
            const data = await res.json();
            setAlert({ message: 'บันทึกข้อมูลสำเร็จ', severity: 'success' });
            setIsEditMode(false);
            // Propagate updated data to parent if provided
            if (onSaved && data?.updatedAccount) {
                onSaved(data.updatedAccount);
            }
        } catch (error: any) {
            setAlert({ message: error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', severity: 'error' });
        } finally {
            setSaving(false);
            // Auto hide alert
            setTimeout(() => setAlert(null), 3000);
        }
    };

    return (
        <>
            <Paper elevation={5} sx={{ p: 2 }}>
                {isAccountDataLoaded ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 3 }}>
                        <CircularProgress />
                        <Typography variant="h6">กำลังโหลดข้อมูลบัญชี...</Typography>
                    </Box>
                ) : accountData ? (
                    <Box sx={{ px: 2, pb: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', alignContent: "flex-end", gap: 1 }}>
                            <Typography sx={{ fontSize: {sx: '10%', md: '100%'}}}>แก้ไขล่าสุดเมื่อวันที่ {new Date(accountData.updatedAt).toLocaleDateString('th-TH')} เวลา {new Date(accountData.updatedAt).toLocaleTimeString('th-TH')} น.</Typography>
                            <Divider orientation="vertical" flexItem />
                            <Typography sx={{ fontSize: {sx: '10%', md: '100%'}}}>เข้าร่วมเมื่อวันที่ {new Date(accountData.createdAt).toLocaleDateString('th-TH')}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: {sx: 'column', md: 'row'}, justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ mb: 2, mt: 1 }}>
                                ข้อมูลผู้ใช้
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                                {iseditMode ? (
                                    <>
                                        <Button variant="contained" color='error' disabled={saving} onClick={handleCancel}>ยกเลิก</Button>
                                        <Button variant="contained" color='success' disabled={!isDirty || saving} onClick={handleSaveData}>
                                            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="contained" onClick={() => setIsEditMode(true)}>แก้ไขข้อมูล</Button>
                                )}
                            </Box>
                        </Box>
                        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                            <Grid size={{ xs: 12, sm: 2 }}>
                                <Typography sx={{ mb: 1 }}>คำนำหน้า</Typography>
                                <TextField
                                    type='text'
                                    value={form.title}
                                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                    fullWidth
                                    disabled={!iseditMode}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 5 }}>
                                <Typography sx={{ mb: 1 }}>ชื่อ</Typography>
                                <TextField
                                    type='text'
                                    value={form.firstName}
                                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                    fullWidth
                                    disabled={!iseditMode}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 5 }}>
                                <Typography sx={{ mb: 1 }}>นามสกุล</Typography>
                                <TextField
                                    type='text'
                                    value={form.lastName}
                                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                    fullWidth
                                    disabled={!iseditMode}
                                />
                            </Grid>
                        </Grid>
                        <Box>
                            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ mb: 2, mt: 1 }}>
                                ข้อมูลบัญชี
                            </Typography>
                        </Box>
                        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography sx={{ mb: 1 }}>อีเมล</Typography>
                                <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <Tooltip title="อีเมลไม่สามารถแก้ไขได้" arrow>
                                        <Typography variant='h6'>{accountData.email}</Typography>
                                    </Tooltip>
                                    <Button variant="outlined" sx={{ mt: 1 }}>เปลี่ยนรหัสผ่าน</Button>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography sx={{ mb: 1 }}>role</Typography>
                                <Tooltip
                                    title={accountData.role === 'SUPER_ADMIN' ? 'ไม่สามารถเปลี่ยนบทบาทของ SUPER ADMIN ได้' : ''}
                                    arrow
                                >
                                    <TextField
                                        select
                                        value={form.role}
                                        onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                                        fullWidth
                                        disabled={!iseditMode || accountData.role === 'SUPER_ADMIN'}
                                    >
                                        <MenuItem value="TEACHER">TEACHER</MenuItem>
                                        <MenuItem value="ADMIN">ADMIN</MenuItem>
                                        {accountData.role === 'SUPER_ADMIN' ? (
                                            <MenuItem value="SUPER_ADMIN">SUPER ADMIN</MenuItem>
                                        ) : null}
                                    </TextField>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: "center", my: 5 }}>
                        <PersonOffIcon sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant={isMobile ? 'h6' : 'h4'}>404 | User Not Found</Typography>
                        <Typography>ไม่พบข้อมูลบัญชีผู้ใช้</Typography>
                    </Box>
                )}
            </Paper>
            {alert && <CustomAlert message={alert.message} severity={alert.severity} />}
        </>
    )
}
export default ProfileCard