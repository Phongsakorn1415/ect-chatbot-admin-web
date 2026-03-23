import React from 'react'
import { Grid, Paper, Typography, Button, Box, Divider, CircularProgress, Backdrop } from '@mui/material';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';

interface CardMenuProps {
    menuItems: {
        title: string;
        description: React.ReactNode;
        icon: React.ReactNode;
        action: () => void;
        loading: boolean;
        disabled?: boolean;
        actionText: string;
        overlayState?: 'loading' | 'error' | 'none';
    }[];
}

const CardMenu = ({ menuItems }: CardMenuProps) => {
    return (
        <Grid container spacing={3}>
            {menuItems.map((item, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            {item.icon}
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {item.title}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography component="div" variant='body2' color='text.secondary' sx={{ flexGrow: 1, mb: 3 }}>
                            {item.description}
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={item.action}
                            disabled={item.loading || (item.disabled ?? false)}
                            startIcon={item.loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {item.loading ? 'กำลังทำงาน...' : item.actionText}
                        </Button>
                        {item.overlayState && item.overlayState !== 'none' && (
                            <Backdrop open={true} sx={{ position: 'absolute', zIndex: 10, flexDirection: 'column', gap: 1, color: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                                {item.overlayState === 'loading' ? (
                                    <>
                                        <CircularProgress color="inherit" size={30} />
                                        <Typography variant="body2">Connecting...</Typography>
                                    </>
                                ) : (
                                    <>
                                        <SignalWifiOffIcon sx={{ fontSize: 30, color: 'error.main' }} />
                                        <Typography variant="body2" color="error.light">Offline</Typography>
                                    </>
                                )}
                            </Backdrop>
                        )}
                    </Paper>
                </Grid>
            ))}
        </Grid>
    )
}

export default CardMenu