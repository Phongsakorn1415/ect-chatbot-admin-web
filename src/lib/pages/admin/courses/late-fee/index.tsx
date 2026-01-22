'use client'

import { Backdrop, Box, CircularProgress, IconButton, Typography } from '@mui/material'
import React from 'react'
import ListIcon from '@mui/icons-material/List';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import getBrackPointResolution from '@/lib/services/BreakPointResolusion';
import MenuDrawer from '@/lib/components/pageComponent/courses/MenuDrawer';
import { DrawerMenuItem } from "@/lib/types/PageDrawer";
import { CourseYear } from '@/lib/types/course-year';
import LateFeeSection from '@/lib/components/pageComponent/courses/lateFeeSection';
import { useRouter } from 'next/navigation';

const drawerWidth = 240;

const LateFeePage = () => {
    const { isMobile, isTablet } = getBrackPointResolution()
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();

    //fetch data for drawer
    const [courseYear, setCourseYear] = React.useState<CourseYear[]>([]);

    const fetchCourseYear = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/course/course-year');
            const data = await response.json();
            const list: CourseYear[] = Array.isArray(data?.data) ? data.data : [];
            setCourseYear(list);
        } catch (error) {
            console.error('Failed to fetch course years:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchCourseYear();
    }, [fetchCourseYear]);

    const drawerItems: DrawerMenuItem[] = Array.isArray(courseYear) ? courseYear.map((cy) => ({
        id: cy.id.toString(),
        title: `หลักสูตรปี ${cy.year}`,
        status: cy.status as 'DRAFT' | 'PUBLISHED',
        onClick: () => { router.push('/admin/courses') }
    })) : [];

    // Keep the drawer closed by default on mobile to avoid horizontal overflow
    const [open, setOpen] = React.useState(!isMobile);
    React.useEffect(() => {
        setOpen(!isMobile);
    }, [isMobile]);

    const handleDrawerOpen = () => setOpen(true);
    const handleDrawerClose = () => setOpen(false);

    return (
        <Box sx={{ display: 'flex', width: '100%', gap: 0 }}>
            {/* Page-scoped drawer at the left within this page area */}
            <MenuDrawer
                isOpen={open}
                drawerWidth={drawerWidth}
                items={drawerItems}
                // Hide add button in this view or keep it functioning?
                // User didn't specify, but usually add button is for courses.
                // I will hide it to avoid confusion or let it redirect?
                // showAddButton={true} would require copying the modal logic.
                // I'll disable it for simplicity in this specific page, or better yet, make it redirect if needed.
                // Existing MenuDrawer prop showAddButton defaults to false.
                showAddButton={false}
            />

            {/* Page content overlays and slides when drawer opens (mobile/tablet) */}
            <Box
                component="main"
                onClick={() => {
                    if ((isMobile || isTablet) && open) handleDrawerClose();
                }}
                sx={{
                    flexGrow: 1,
                    p: { xs: 1.5, sm: 2, md: 3 },
                    minWidth: 0,
                    transform: (isMobile || isTablet) && open ? `translateX(${drawerWidth}px)` : 'none',
                    transition: (theme) => theme.transitions.create('transform', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.standard,
                    }),
                }}
            >
                <Typography
                    variant='h4'
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        flexWrap: 'wrap',
                        columnGap: 1,
                        rowGap: 1,
                        minWidth: 0,
                        maxWidth: '100%'
                    }}
                >
                    <IconButton size='large' color='inherit' sx={{ mr: 1 }} onClick={open ? handleDrawerClose : handleDrawerOpen}>
                        {open ? <MenuOpenIcon /> : <ListIcon />}
                    </IconButton>
                    จัดการค่าปรับ
                </Typography>
                <LateFeeSection />
            </Box>
            <Backdrop
                sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}
                open={loading}
            >
                <CircularProgress />
            </Backdrop>
        </Box>
    )
}

export default LateFeePage
