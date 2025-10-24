'use client'

import { Box, Grid, IconButton, Typography } from '@mui/material'
import React from 'react'
import ListIcon from '@mui/icons-material/List';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import getBrackPointResolution from '@/lib/services/BreakPointResolusion';
import MenuDrawer from '@/lib/components/pageComponent/courses/MenuDrawer';
import { DrawerMenuItem } from "@/lib/types/PageDrawer";
import { CourseYear } from '@/lib/types/course-year';
import { CourseFee } from '@/lib/types/course-fee';
import FeeSection from '@/lib/components/pageComponent/courses/feeSection';

const drawerWidth = 240;

const CoursesPage = () => {
  const { isMobile, isTablet } = getBrackPointResolution()
  const [currentCourseYearID, setCurrentCourseYearID] = React.useState<number | null>(null);

  //fetch data
  const [courseYear, setCourseYear] = React.useState<CourseYear[]>([]);
  const [courseFee, setCourseFee] = React.useState<CourseFee | null>(null);

  React.useEffect(() => {
    const fetchCourseYear = async () => {
      const response = await fetch('/api/course/course-year');
      const data = await response.json();
      const list: CourseYear[] = Array.isArray(data?.data) ? data.data : [];
      setCurrentCourseYearID(list.length > 0 ? list[0].id : null);
      setCourseYear(list);
    };
    fetchCourseYear();
  }, []);

  React.useEffect(() => {
    console.log('Current Course Year ID changed: ', currentCourseYearID);
    const fetchCourseFee = async () => {
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
    }
    fetchCourseFee();
  }, [currentCourseYearID]);

  const drawerItems: DrawerMenuItem[] = Array.isArray(courseYear) ? courseYear.map((cy) => ({
    id: cy.id.toString(),
    title: `หลักสูตรปี ${cy.year}`,
    onClick: () => { setCurrentCourseYearID(cy.id) }
  })) : [];

  const [open, setOpen] = React.useState(true);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  return (
    <Box sx={{ display: 'flex', width: '100%', gap: 0 }}>
      {/* Page-scoped drawer at the left within this page area */}
      <MenuDrawer
        isOpen={open}
        drawerWidth={drawerWidth}
        items={drawerItems}
        showAddButton={true}
        addButtonText="เพิ่มหลักสูตรใหม่"
        onAddButtonClick={() => alert('Clicked เพิ่มหลักสูตรใหม่')}
      />

      {/* Page content sits to the right and naturally takes remaining space */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
          <IconButton size='large' color='inherit' sx={{ mr: 1 }} onClick={open ? handleDrawerClose : handleDrawerOpen}>
            {open ? <MenuOpenIcon /> : <ListIcon />}
          </IconButton>
          หลักสูตรปี {currentCourseYearID ? courseYear.find(cy => cy.id === currentCourseYearID)?.year : 'ไม่ระบุ'}
        </Typography>
        <FeeSection
          courseYearId={currentCourseYearID}
          courseFee={courseFee}
          onUpdated={(fee) => setCourseFee(fee)}
        />
      </Box>
    </Box>
  )
}

export default CoursesPage
