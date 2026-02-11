'use client'

import { Backdrop, Box, Button, CircularProgress, Grid, IconButton, Link, Paper, Typography } from '@mui/material'
import React from 'react'

import ListIcon from '@mui/icons-material/List';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';

import getBrackPointResolution from '@/lib/services/BreakPointResolusion';
import MenuDrawer from '@/lib/components/pageComponent/courses/MenuDrawer';
import { DrawerMenuItem } from "@/lib/types/PageDrawer";
import { CourseYear } from '@/lib/types/course-year';
import { CourseFee } from '@/lib/types/course-fee';
import NewCourseModal from '@/lib/components/pageComponent/courses/CreateCourseModal';

import FeeSection from '@/lib/components/pageComponent/courses/feeSection';
import SubjectSection from '@/lib/components/pageComponent/courses/subjectSection';

const drawerWidth = 240;

const CoursesPage = () => {
  const { isMobile, isTablet } = getBrackPointResolution()
  const [currentCourseYearID, setCurrentCourseYearID] = React.useState<number | null>(null);

  const [loading, setLoading] = React.useState(false);

  //fetch data
  const [courseYear, setCourseYear] = React.useState<CourseYear[]>([]);
  const [courseFee, setCourseFee] = React.useState<CourseFee | null>(null);

  const fetchCourseYear = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/course/course-year');
      const data = await response.json();
      const list: CourseYear[] = Array.isArray(data?.data) ? data.data : [];
      setCourseYear(list);
      if (list.length > 0 && (currentCourseYearID === null || !list.some(cy => cy.id === currentCourseYearID))) {
        setCurrentCourseYearID(list[0].id);
      }
      if (list.length === 0) setCurrentCourseYearID(null);
    } catch (error) {
      console.error('Failed to fetch course years:', error);
    } finally {
      setLoading(false);
    }
  }, [currentCourseYearID]);

  React.useEffect(() => {
    fetchCourseYear();
  }, [fetchCourseYear]);

  React.useEffect(() => {
    const fetchCourseFee = async () => {
      try {
        setLoading(true);
        if (currentCourseYearID === null) {
          setCourseFee(null);
          return;
        }
        const response = await fetch(`/api/course/course-fee/${currentCourseYearID}`);
        if (response.ok) {
          const data = await response.json();
          setCourseFee(data.data);
        } else {
          setCourseFee(null);
        }
      } catch (error) {
        console.error('Failed to fetch course fee:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseFee();
  }, [currentCourseYearID]);

  const drawerItems: DrawerMenuItem[] = Array.isArray(courseYear) ? courseYear.map((cy) => ({
    id: cy.id.toString(),
    title: `หลักสูตรปี ${cy.year}`,
    status: cy.status as 'DRAFT' | 'PUBLISHED',
    onClick: () => { setCurrentCourseYearID(cy.id) }
  })) : [];

  // Keep the drawer closed by default on mobile to avoid horizontal overflow
  const [open, setOpen] = React.useState(!isMobile);
  React.useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);
  const [openNewCourseModal, setOpenNewCourseModal] = React.useState(false);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleDeleteCourse = async () => {
    if (currentCourseYearID == null) return;
    const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตรนี้? การกระทำนี้ไม่สามารถย้อนกลับได้");
    if (!confirm) return;

    try {
      const response = await fetch(`/api/course/course-year/${currentCourseYearID}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete course");
      setCurrentCourseYearID(null);
      fetchCourseYear();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const handleChangeCourse = async () => {
    if (currentCourseYearID == null) return;
    const AlertMessage = courseYear.find(cy => cy.id === currentCourseYearID)?.status === 'DRAFT' ? "คุณแน่ใจหรือไม่ว่าต้องการเผยแพร่หลักสูตรนี้?" : "คุณแน่ใจหรือไม่ว่าต้องการตั้งหลักสูตรนี้เป็นร่าง?";
    const confirm = window.confirm(AlertMessage);
    if (!confirm) return;
    try {
      const response = await fetch(`/api/course/course-year/${currentCourseYearID}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: courseYear.find(cy => cy.id === currentCourseYearID)?.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' }),
      });
      if (!response.ok) throw new Error("Failed to change course status");
      fetchCourseYear();
    } catch (error) {
      console.error("Error changing course status:", error);
    }
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%', gap: 0 }}>
      {/* Page-scoped drawer at the left within this page area */}
      <MenuDrawer
        isOpen={open}
        drawerWidth={drawerWidth}
        items={drawerItems}
        showAddButton={true}
        addButtonText="เพิ่มหลักสูตรใหม่"
        onAddButtonClick={() => setOpenNewCourseModal(true)}
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
            maxWidth: '100%',
          }}
        >
          <IconButton size='large' color='inherit' sx={{ mr: 1 }} onClick={open ? handleDrawerClose : handleDrawerOpen}>
            {open ? <MenuOpenIcon /> : <ListIcon />}
          </IconButton>
          {currentCourseYearID ?
            <>
              หลักสูตรปี {courseYear.find(cy => cy.id === currentCourseYearID)?.year}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: { xs: 0, sm: 2 } }}>
                <Button
                  variant="outlined"
                  onClick={handleChangeCourse}
                  color={courseYear.find(cy => cy.id === currentCourseYearID)?.status === 'DRAFT' ? 'success' : 'primary'}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {courseYear.find(cy => cy.id === currentCourseYearID)?.status === 'DRAFT' ? 'เผยแพร่หลักสูตร' : 'ตั้งเป็นร่าง'}
                </Button>
                <Button variant="outlined" color="error" onClick={handleDeleteCourse} sx={{ whiteSpace: 'nowrap' }}>
                  ลบหลักสูตร
                </Button>
              </Box>
            </>
            : <></>
          }
        </Typography>
        {currentCourseYearID ?
          <>
            <FeeSection
              courseYearId={currentCourseYearID}
              courseFee={courseFee}
              onUpdated={(fee) => setCourseFee(fee)}
            />
            <SubjectSection
              courseYearId={currentCourseYearID}
              courseYearYear={currentCourseYearID ? courseYear.find(cy => cy.id === currentCourseYearID)?.year ?? null : null}
            />
          </> :
          <>
            <Paper elevation={5} sx={{ px: 2, py: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5ff' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <ArticleOutlinedIcon sx={{ fontSize: 48 }} />
                <Box>
                  <Typography variant='h6' sx={{ textAlign: 'center' }}>
                    ไม่พบหลักสูตร
                  </Typography>
                  <Typography variant='h6' sx={{ textAlign: 'center' }}>
                    กรุณา<Link color='primary' sx={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', px: 1 }} onClick={() => setOpenNewCourseModal(true)}>สร้างหลักสูตร</Link>ใหม่
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </>
        }
      </Box>

      <Backdrop
        sx={(theme) => ({ zIndex: theme.zIndex.drawer + 100 })}
        open={loading}
      >
        <CircularProgress />
      </Backdrop>
      <NewCourseModal
        open={openNewCourseModal}
        onClose={() => setOpenNewCourseModal(false)}
        onCreated={(created) => {
          // Refresh list and focus the newly created course year
          fetchCourseYear().then(() => {
            if (created?.courseYear?.id) {
              setCurrentCourseYearID(created.courseYear.id);
            }
          });
        }}
      />
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 99 })}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  )
}

export default CoursesPage
