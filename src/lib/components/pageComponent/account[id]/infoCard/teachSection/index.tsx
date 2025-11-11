'use client'
import React, { useEffect, useMemo, useState } from "react"
import { Box, Tab, Tabs, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton, Checkbox, Toolbar, Button, TablePagination } from "@mui/material"
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { CustomTabPanel, a11yProps } from "@/lib/components/TabsProvider"
import { useParams } from "next/navigation"
import AddSubjectModal from "./addSubjectModal";
import SubjectSearch from "./subjectSearch";

type TeachRow = {
  id: number
  subject_id: {
    id: number
    name: string
    code?: string | null
    Course_year_id: { id: number; year: number }
  }
}

type CourseYear = { id: number; year: number };

interface TeachSectionProps {
  accountId?: number
}

const TeachSection: React.FC<TeachSectionProps> = ({ accountId }) => {
  const [TabValue, setTabValue] = useState(0);
  const [AllCourses, setAllCourses] = useState<CourseYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [subjectsByYear, setSubjectsByYear] = useState<Record<number, TeachRow[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openAddDialog, setOpenAddDialog] = useState(false);
  // Search filters for current tab
  const [codeQuery, setCodeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  // Dialog states for add/remove subjects
  const [dialogTabValue, setDialogTabValue] = useState(0);
  const [dialogLoadingByYear, setDialogLoadingByYear] = useState<Record<number, boolean>>({});
  // All subjects available per course year id
  const [subjectsOfYear, setSubjectsOfYear] = useState<Record<number, Array<{ id: number; name: string; code?: string; course_yearId?: number }>>>({});
  // Initially assigned subjectId -> teachId for each year (by course year number)
  const [assignedMapByYear, setAssignedMapByYear] = useState<Record<number, Map<number, number>>>({});
  // Current checked subjectIds per year (by course year number)
  const [checkedByYear, setCheckedByYear] = useState<Record<number, Set<number>>>({});
  const [savingDialog, setSavingDialog] = useState(false);
  // Pagination per course (keyed by course.id)
  const [pageByCourse, setPageByCourse] = useState<Record<number, number>>({});
  const [rowsPerPageByCourse, setRowsPerPageByCourse] = useState<Record<number, number>>({});

  const params = useParams();
  const accountIdFromRoute = typeof params?.id === 'string' ? Number(params.id) : Array.isArray(params?.id) ? Number(params.id?.[0]) : undefined;
  const effectiveAccountId = accountId ?? accountIdFromRoute;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/course/course-year');
        const data = await response.json();
        console.log('Fetched courses:', data);
        setAllCourses(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, [])

  // Fetch subjects for the selected course year
  useEffect(() => {
    const doFetch = async () => {
      if (!effectiveAccountId) return; // cannot fetch without account id
      if (!AllCourses.length) return;
      const currentCourse = AllCourses[TabValue];
      if (!currentCourse) return;
      const year: number = currentCourse.year;

      // Use cache if available
      if (subjectsByYear[year]) return;
      try {
        setIsSubjectsLoading(true);
        const res = await fetch(`/api/accounts/${effectiveAccountId}/teach?course_year=${encodeURIComponent(year)}`);
        const data: TeachRow[] = await res.json();
        setSubjectsByYear(prev => ({ ...prev, [year]: Array.isArray(data) ? data : [] }));
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjectsByYear(prev => ({ ...prev, [year]: [] }));
      } finally {
        setIsSubjectsLoading(false);
      }
    }
    doFetch();
  }, [TabValue, AllCourses, effectiveAccountId])

  // Reset search when switching tab
  useEffect(() => {
    setCodeQuery("");
    setNameQuery("");
  }, [TabValue]);

  const renderLoadingRows = (rows: number = 5) => (
    Array.from({ length: rows }).map((_, i) => (
      <TableRow key={`sk-${i}`}>
        <TableCell padding="checkbox"><Skeleton variant="rectangular" height={24} /></TableCell>
        <TableCell width={80}><Skeleton /></TableCell>
        <TableCell><Skeleton /></TableCell>
      </TableRow>
    ))
  )

  const currentCourse = AllCourses[TabValue];
  const currentYear = currentCourse?.year as number | undefined;

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const handleSelectAll = () => {
    if (!currentYear) return;
    const rows = subjectsByYear[currentYear] ?? [];
    const allIds = rows.map(r => r.id);
    const allSelected = allIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        // unselect all
        allIds.forEach(id => next.delete(id));
      } else {
        allIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  const handleOpenAdd = () => {
    setOpenAddDialog(true);
    setDialogTabValue(0);
  }
  const handleCloseAdd = () => setOpenAddDialog(false);

  // Helpers for dialog data fetching
  // Fetch dialog data (subjects cached, assignments always refreshed to avoid stale selections)
  const ensureDialogDataForYear = async (courseYearNumber: number, courseYearId: number) => {
    const needSubjects = !subjectsOfYear[courseYearId];
    setDialogLoadingByYear(prev => ({ ...prev, [courseYearNumber]: true }));
    try {
      if (needSubjects) {
        const resSubjects = await fetch(`/api/course/course-year/${courseYearId}/subject`);
        const subjects = await resSubjects.json();
        setSubjectsOfYear(prev => ({ ...prev, [courseYearId]: Array.isArray(subjects) ? subjects : [] }));
      }
      if (effectiveAccountId) {
        const resAssigned = await fetch(`/api/accounts/${effectiveAccountId}/teach?course_year=${encodeURIComponent(courseYearNumber)}`);
        const assigned: TeachRow[] = await resAssigned.json();
        const map = new Map<number, number>();
        assigned.forEach(row => {
          const sid = row.subject_id?.id;
          if (sid) map.set(sid, row.id);
        });
        setAssignedMapByYear(prev => ({ ...prev, [courseYearNumber]: map }));
        setCheckedByYear(prev => {
          // Preserve existing user selections for this year; only initialize if not present
          if (prev[courseYearNumber] !== undefined) return prev;
          return { ...prev, [courseYearNumber]: new Set(map.keys()) };
        });
      }
    } catch (e) {
      console.error('Error fetching dialog data:', e);
      if (needSubjects) setSubjectsOfYear(prev => ({ ...prev, [courseYearId]: [] }));
      setAssignedMapByYear(prev => ({ ...prev, [courseYearNumber]: new Map() }));
      setCheckedByYear(prev => {
        // Don't overwrite existing checked state on error; initialize only if missing
        if (prev[courseYearNumber] !== undefined) return prev;
        return { ...prev, [courseYearNumber]: new Set() };
      });
    } finally {
      setDialogLoadingByYear(prev => ({ ...prev, [courseYearNumber]: false }));
    }
  }

  // When dialog opens or tab changes inside dialog, ensure data
  useEffect(() => {
    if (!openAddDialog) return;
    if (!AllCourses.length) return;
    const course = AllCourses[dialogTabValue];
    if (!course) return;
    const courseYearNumber = course.year as number;
    const courseYearId = course.id as number;
    ensureDialogDataForYear(courseYearNumber, courseYearId);
  }, [openAddDialog, dialogTabValue, AllCourses, effectiveAccountId]);

  const handleDialogToggle = (courseYearNumber: number, subjectId: number) => {
    setCheckedByYear(prev => {
      const nextSet = new Set(prev[courseYearNumber] ?? []);
      if (nextSet.has(subjectId)) nextSet.delete(subjectId); else nextSet.add(subjectId);
      return { ...prev, [courseYearNumber]: nextSet };
    });
  };

  const handleConfirmAdd = async () => {
    if (!effectiveAccountId) return;
    try {
      setSavingDialog(true);
      const years = Object.keys(checkedByYear).map(Number);
      const ops: Array<Promise<Response>> = [];
      const changedYears: number[] = [];
      const alreadyAdded = new Set<number>(); // prevent duplicate POST of same subject id in this save batch

      years.forEach(yearNum => {
        const currentChecked = checkedByYear[yearNum] ?? new Set<number>();
        const initiallyAssignedMap = assignedMapByYear[yearNum] ?? new Map<number, number>();
        const initiallyAssigned = new Set<number>(initiallyAssignedMap.keys());
        let yearChanged = false;

        // additions
        currentChecked.forEach(sid => {
          if (!initiallyAssigned.has(sid) && !alreadyAdded.has(sid)) {
            alreadyAdded.add(sid);
            yearChanged = true;
            ops.push(fetch('/api/course/subject/teach', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subject_id: sid, user_id: effectiveAccountId })
            }));
          }
        });

        // deletions
        initiallyAssigned.forEach(sid => {
          if (!currentChecked.has(sid)) {
            const teachId = initiallyAssignedMap.get(sid);
            if (teachId) {
              yearChanged = true;
              ops.push(fetch(`/api/course/subject/teach/${teachId}`, { method: 'DELETE' }));
            }
          }
        });

        if (yearChanged) changedYears.push(yearNum);
      });

      if (ops.length === 0) {
        // Nothing changed, just close
        setOpenAddDialog(false);
        return;
      }

      await Promise.all(ops);

      // Invalidate cached subjects for changed years so main tabs refetch when selected
      setSubjectsByYear(prev => {
        const copy = { ...prev };
        changedYears.forEach(y => { delete copy[y]; });
        return copy;
      });

      // Refresh assignments & checked state for changed years (keeping dialog consistent if it stays open briefly)
      for (const y of changedYears) {
        try {
          if (!effectiveAccountId) continue;
          const resAssigned = await fetch(`/api/accounts/${effectiveAccountId}/teach?course_year=${encodeURIComponent(y)}`);
          const assigned: TeachRow[] = await resAssigned.json();
          const map = new Map<number, number>();
          assigned.forEach(row => { const sid = row.subject_id?.id; if (sid) map.set(sid, row.id); });
          setAssignedMapByYear(prev => ({ ...prev, [y]: map }));
          setCheckedByYear(prev => ({ ...prev, [y]: new Set(map.keys()) }));
        } catch (e) {
          console.error('Error refreshing assignments after save for year', y, e);
        }
      }

      // Refresh current visible tab data if its year changed
      if (currentYear && changedYears.includes(currentYear)) {
        try {
          setIsSubjectsLoading(true);
          const res = await fetch(`/api/accounts/${effectiveAccountId}/teach?course_year=${encodeURIComponent(currentYear)}`);
          const data: TeachRow[] = await res.json();
          setSubjectsByYear(prev => ({ ...prev, [currentYear]: Array.isArray(data) ? data : [] }));
        } catch (e) {
          console.error('Error refreshing subjects after save:', e);
        } finally {
          setIsSubjectsLoading(false);
        }
      }

      setOpenAddDialog(false);
    } finally {
      setSavingDialog(false);
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return;
    const selectedTeachIds = Array.from(selectedIds);

    // Group selected rows by course year for proper cache refresh and dialog state sync
    const affectedByYear: Record<number, { teachIds: number[]; subjectIds: number[] }> = {};
    const knownTeachIds = new Set<number>();
    Object.entries(subjectsByYear).forEach(([yearStr, rows]) => {
      const yearNum = Number(yearStr);
      const teachIds: number[] = [];
      const subjectIds: number[] = [];
      (rows ?? []).forEach(r => {
        if (selectedIds.has(r.id)) {
          knownTeachIds.add(r.id);
          teachIds.push(r.id);
          const sid = r.subject_id?.id;
          if (sid) subjectIds.push(sid);
        }
      });
      if (teachIds.length > 0) affectedByYear[yearNum] = { teachIds, subjectIds };
    });

    try {
      setIsSubjectsLoading(true);
      // Delete all selected teach rows regardless of current tab
      await Promise.all(selectedTeachIds.map(teachId => fetch(`/api/course/subject/teach/${teachId}`, { method: 'DELETE' })));

      // Refresh each affected year list and dialog caches
      await Promise.all(
        Object.keys(affectedByYear).map(async (yearStr) => {
          const y = Number(yearStr);
          try {
            if (effectiveAccountId) {
              const res = await fetch(`/api/accounts/${effectiveAccountId}/teach?course_year=${encodeURIComponent(y)}`);
              const data: TeachRow[] = await res.json();
              const normalized = Array.isArray(data) ? data : [];
              setSubjectsByYear(prev => ({ ...prev, [y]: normalized }));

              // Update dialog assignment and checked states from fresh data
              const map = new Map<number, number>();
              normalized.forEach(row => {
                const sid = row.subject_id?.id;
                if (sid) map.set(sid, row.id);
              });
              setAssignedMapByYear(prev => ({ ...prev, [y]: map }));
              setCheckedByYear(prev => ({ ...prev, [y]: new Set(map.keys()) }));
            } else {
              // If no account id, at least prune removed rows locally
              const removedTeachIds = new Set(affectedByYear[y]?.teachIds ?? []);
              setSubjectsByYear(prev => ({ ...prev, [y]: (prev[y] ?? []).filter(r => !removedTeachIds.has(r.id)) }));
            }
          } catch (err) {
            console.error('Error refreshing year after deletion:', y, err);
          }
        })
      );

      // Clear global selection
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Error deleting selected teach rows:', e);
    } finally {
      setIsSubjectsLoading(false);
    }
  }

  // Whether dialog has any unsaved changes across years
  const hasDialogChanges = useMemo(() => {
    return Object.keys(checkedByYear).some(yearStr => {
      const year = Number(yearStr);
      const checked = checkedByYear[year] ?? new Set<number>();
      const assignedMap = assignedMapByYear[year] ?? new Map<number, number>();
      if (checked.size !== assignedMap.size) return true;
      for (const sid of checked) if (!assignedMap.has(sid)) return true;
      for (const sid of assignedMap.keys()) if (!checked.has(sid)) return true;
      return false;
    });
  }, [checkedByYear, assignedMapByYear]);

  return (
    <>
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>วิชาที่สอนทั้งหมด</Typography>
        <Toolbar disableGutters sx={{ gap: 1, mb: 1 }}>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} disabled={!effectiveAccountId || AllCourses.length === 0}>เพิ่มวิชา</Button>
          <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={handleRemoveSelected} disabled={selectedIds.size === 0}>ลบ ({selectedIds.size})</Button>
        </Toolbar>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={TabValue} onChange={(event, newValue) => setTabValue(newValue)} aria-label="basic tabs example">
            {isLoading && (
              <Tab disabled label="Loading..." />
            )}
            {!isLoading && AllCourses.length > 0 && (
              AllCourses.map((course, index) => (
                <Tab key={course.id} label={course.year} {...a11yProps(index)} />
              ))
            )}
            {!isLoading && AllCourses.length === 0 && (
              <Tab label="No Courses Available" />
            )}
          </Tabs>
        </Box>
        {!isLoading && AllCourses.length > 0 && (
          AllCourses.map((course, index) => {
            const year = course.year as number;
            const courseId = course.id as number;
            const rows = subjectsByYear[year] ?? [];
            const filteredRows = rows.filter(r => {
              const code = (r.subject_id?.code ?? "").toString().toLowerCase();
              const name = (r.subject_id?.name ?? "").toString().toLowerCase();
              const codeOk = codeQuery.trim() === "" || code.includes(codeQuery.trim().toLowerCase());
              const nameOk = nameQuery.trim() === "" || name.includes(nameQuery.trim().toLowerCase());
              return codeOk && nameOk;
            });
            const rpp = rowsPerPageByCourse[courseId] ?? 10;
            const rawPage = pageByCourse[courseId] ?? 0;
            const totalPages = rpp > 0 ? Math.max(1, Math.ceil(filteredRows.length / rpp)) : 1;
            const safePage = Math.min(rawPage, totalPages - 1);
            const pageStart = safePage * rpp;
            const pageEnd = pageStart + rpp;
            const visibleRows = filteredRows.slice(pageStart, pageEnd);
            const allVisibleSelectedCount = visibleRows.filter(r => selectedIds.has(r.id)).length;
            const showEmpty = !isSubjectsLoading && rows.length === 0;
            return (
              <CustomTabPanel key={course.id} value={TabValue} index={index}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>วิชาที่มีสอนทั้งหมดในหลักสูตรปี {course.year}</Typography>
                <SubjectSearch
                  code={codeQuery}
                  name={nameQuery}
                  onCodeChange={(v) => {
                    setCodeQuery(v);
                    setPageByCourse(prev => ({ ...prev, [courseId]: 0 }));
                  }}
                  onNameChange={(v) => {
                    setNameQuery(v);
                    setPageByCourse(prev => ({ ...prev, [courseId]: 0 }));
                  }}
                />
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" aria-label="subjects table">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            indeterminate={visibleRows.length > 0 && allVisibleSelectedCount > 0 && allVisibleSelectedCount < visibleRows.length}
                            checked={visibleRows.length > 0 && allVisibleSelectedCount === visibleRows.length}
                            onChange={() => {
                              const ids = visibleRows.map(r => r.id);
                              const allSelected = ids.length > 0 && ids.every(id => selectedIds.has(id));
                              setSelectedIds(prev => {
                                const next = new Set(prev);
                                if (allSelected) ids.forEach(id => next.delete(id));
                                else ids.forEach(id => next.add(id));
                                return next;
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>รหัสวิชา</TableCell>
                        <TableCell>ชื่อวิชา</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isSubjectsLoading && renderLoadingRows(5)}
                      {!isSubjectsLoading && visibleRows.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={selectedIds.has(row.id)}
                              onChange={() => handleToggleSelect(row.id)}
                            />
                          </TableCell>
                          <TableCell>{row.subject_id?.code ?? '-'}</TableCell>
                          <TableCell>{row.subject_id?.name ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                      {!isSubjectsLoading && rows.length > 0 && filteredRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา
                          </TableCell>
                        </TableRow>
                      )}
                      {showEmpty && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            ไม่มีวิชาที่สอนในปีนี้
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {!isSubjectsLoading && filteredRows.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <TablePagination
                      component="div"
                      count={filteredRows.length}
                      page={safePage}
                      onPageChange={(_, newPage) => setPageByCourse(prev => ({ ...prev, [courseId]: newPage }))}
                      rowsPerPage={rpp}
                      onRowsPerPageChange={(e) => {
                        const newRpp = parseInt(e.target.value, 10);
                        setRowsPerPageByCourse(prev => ({ ...prev, [courseId]: newRpp }));
                        setPageByCourse(prev => ({ ...prev, [courseId]: 0 }));
                      }}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="แสดงต่อหน้า"
                      sx={{
                        '& .MuiTablePagination-toolbar': {
                          flexWrap: 'wrap',
                          justifyContent: { xs: 'center', md: 'flex-end' },
                          gap: { xs: 0, md: 1 },
                          overflowX: 'auto',
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </Box>
                )}
              </CustomTabPanel>
            )
          })
        )}
      </Box>

      <AddSubjectModal
        open={openAddDialog}
        onClose={handleCloseAdd}
        courses={AllCourses}
        tabValue={dialogTabValue}
        onTabChange={setDialogTabValue}
        loadingByYear={dialogLoadingByYear}
        subjectsOfYear={subjectsOfYear}
        checkedByYear={checkedByYear}
        setCheckedByYear={setCheckedByYear}
        onToggle={handleDialogToggle}
        onConfirm={handleConfirmAdd}
        saving={savingDialog}
        canSave={!!effectiveAccountId && !!hasDialogChanges}
      />
    </>
  )
}
export default TeachSection
