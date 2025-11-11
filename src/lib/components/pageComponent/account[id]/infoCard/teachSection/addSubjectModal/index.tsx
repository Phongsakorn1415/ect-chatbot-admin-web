'use client'
import React from 'react'
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Skeleton,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    TextField,
    TablePagination,
} from '@mui/material'
import { CustomTabPanel, a11yProps } from '@/lib/components/TabsProvider'

type SubjectRow = { id: number; name: string; code?: string; course_yearId?: number }

type Course = { id: number; year: number } & Record<string, any>

interface AddSubjectModalProps {
    open: boolean
    onClose: () => void
    courses: Course[]
    tabValue: number
    onTabChange: (value: number) => void
    loadingByYear: Record<number, boolean>
    subjectsOfYear: Record<number, SubjectRow[]>
    checkedByYear: Record<number, Set<number>>
    setCheckedByYear: React.Dispatch<React.SetStateAction<Record<number, Set<number>>>>
    onToggle: (yearNum: number, subjectId: number) => void
    onConfirm: () => void
    saving: boolean
    canSave: boolean
}

const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
    open,
    onClose,
    courses,
    tabValue,
    onTabChange,
    loadingByYear,
    subjectsOfYear,
    checkedByYear,
    setCheckedByYear,
    onToggle,
    onConfirm,
    saving,
    canSave,
}) => {
    const currentCourse = courses[tabValue]
    type SearchType = 'code' | 'name'
    const [searchTypeByYear, setSearchTypeByYear] = React.useState<Record<number, SearchType>>({})
    const [searchQueryByYear, setSearchQueryByYear] = React.useState<Record<number, string>>({})
    const [pageByYear, setPageByYear] = React.useState<Record<number, number>>({})
    const [rowsPerPageByYear, setRowsPerPageByYear] = React.useState<Record<number, number>>({})

    const getSearchType = (yearId: number): SearchType => searchTypeByYear[yearId] ?? 'code'
    const getSearchQuery = (yearId: number): string => searchQueryByYear[yearId] ?? ''
    const getPage = (yearId: number): number => pageByYear[yearId] ?? 0
    const getRowsPerPage = (yearId: number): number => rowsPerPageByYear[yearId] ?? 10

    const handleSearchTypeChange = (yearId: number, value: string) => {
        setSearchTypeByYear(prev => ({ ...prev, [yearId]: (value as SearchType) }))
        // reset page when search type changes
        setPageByYear(prev => ({ ...prev, [yearId]: 0 }))
    }
    const handleSearchQueryChange = (yearId: number, value: string) => {
        setSearchQueryByYear(prev => ({ ...prev, [yearId]: value }))
        // reset page when query changes
        setPageByYear(prev => ({ ...prev, [yearId]: 0 }))
    }
    const currentCheckedSize = React.useMemo(() => {
        if (!currentCourse) return 0
        const yearNum = currentCourse.year as number
        return (checkedByYear[yearNum]?.size ?? 0)
    }, [courses, tabValue, checkedByYear, currentCourse])

    // Total subjects for the currently displayed course
    const currentCourseSubjectsCount = React.useMemo(() => {
        if (!currentCourse) return 0
        const yearId = currentCourse.id as number
        return (subjectsOfYear[yearId]?.length ?? 0)
    }, [currentCourse, subjectsOfYear])

    // Total subjects across all course years (available loaded rows)
    const totalSubjectsCount = React.useMemo(() => {
        return courses.reduce((acc, c) => {
            const rows = subjectsOfYear[c.id] ?? []
            return acc + rows.length
        }, 0)
    }, [courses, subjectsOfYear])

    // Total selected across all years (union of checked sets)
    const totalSelectedCount = React.useMemo(() => {
        return Object.values(checkedByYear).reduce((acc, set) => acc + (set?.size ?? 0), 0)
    }, [checkedByYear])

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>จัดการวิชาที่สอน</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        วิชาทั้งหมดรวมทุกหลักสูตร: {totalSubjectsCount} รายวิชา | หลักสูตรนี้เลือกแล้ว: {currentCheckedSize} / {currentCourseSubjectsCount} รายวิชา
                    </Typography>
                </Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, v) => onTabChange(v)}
                        variant="scrollable"
                        scrollButtons
                        allowScrollButtonsMobile
                    >
                        {courses.map((c, i) => (
                            <Tab key={c.id} label={c.year} {...a11yProps(i)} />
                        ))}
                    </Tabs>
                </Box>
                {courses.map((c, i) => {
                    const yearNum = c.year as number
                    const yearId = c.id as number
                    const loading = !!loadingByYear[yearNum]
                    const rows = subjectsOfYear[yearId] ?? []
                    const checked = checkedByYear[yearNum] ?? new Set<number>()
                    const searchType = getSearchType(yearId)
                    const searchQuery = getSearchQuery(yearId).trim().toLowerCase()
                    const filteredRows = !searchQuery
                        ? rows
                        : rows.filter(r => {
                            if (searchType === 'code') return (r.code ?? '').toLowerCase().includes(searchQuery)
                            return (r.name ?? '').toLowerCase().includes(searchQuery)
                        })
                    const rawPage = getPage(yearId)
                    const rpp = getRowsPerPage(yearId)
                    const totalPages = rpp > 0 ? Math.max(1, Math.ceil(filteredRows.length / rpp)) : 1
                    const safePage = Math.min(rawPage, totalPages - 1)
                    const pageStart = safePage * rpp
                    const pageEnd = pageStart + rpp
                    const visibleRows = filteredRows.slice(pageStart, pageEnd)
                    const allVisibleSelectedCount = visibleRows.filter(r => checked.has(r.id)).length
                    return (
                        <CustomTabPanel key={c.id} value={tabValue} index={i}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                รายวิชาทั้งหมด ปีหลักสูตร {c.year}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel id={`search-type-${yearId}`}>ค้นหาตาม</InputLabel>
                                    <Select
                                        labelId={`search-type-${yearId}`}
                                        label="ค้นหาตาม"
                                        value={searchType}
                                        onChange={e => handleSearchTypeChange(yearId, e.target.value as string)}
                                    >
                                        <MenuItem value="code">รหัสวิชา</MenuItem>
                                        <MenuItem value="name">ชื่อวิชา</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    size="small"
                                    label={searchType === 'code' ? 'ค้นหารหัสวิชา' : 'ค้นหาชื่อวิชา'}
                                    placeholder={searchType === 'code' ? 'เช่น 012345' : 'เช่น คณิตศาสตร์'}
                                    value={getSearchQuery(yearId)}
                                    onChange={e => handleSearchQueryChange(yearId, e.target.value)}
                                />
                            </Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    indeterminate={visibleRows.length > 0 && allVisibleSelectedCount > 0 && allVisibleSelectedCount < visibleRows.length}
                                                    checked={visibleRows.length > 0 && allVisibleSelectedCount === visibleRows.length}
                                                    onChange={() => {
                                                        setCheckedByYear(prev => {
                                                            const allIds = visibleRows.map(r => r.id)
                                                            const allSelected = allVisibleSelectedCount === visibleRows.length && visibleRows.length > 0
                                                            const newSet = new Set(checked)
                                                            if (allSelected) {
                                                                // unselect only visible
                                                                allIds.forEach(id => newSet.delete(id))
                                                            } else {
                                                                // select visible
                                                                allIds.forEach(id => newSet.add(id))
                                                            }
                                                            return { ...prev, [yearNum]: newSet }
                                                        })
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>รหัสวิชา</TableCell>
                                            <TableCell>ชื่อวิชา</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading &&
                                            Array.from({ length: 6 }).map((_, idx) => (
                                                <TableRow key={`dlg-sk-${idx}`}>
                                                    <TableCell padding="checkbox">
                                                        <Skeleton variant="rectangular" height={24} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        {!loading &&
                                            visibleRows.map((s, idx2) => (
                                                <TableRow key={s.id} hover>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            size="small"
                                                            checked={checked.has(s.id)}
                                                            onChange={() => onToggle(yearNum, s.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{s.code ?? '-'}</TableCell>
                                                    <TableCell>{s.name ?? '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        {!loading && rows.length > 0 && filteredRows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {!loading && rows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    ไม่มีรายวิชาในปีหลักสูตรนี้
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {!loading && filteredRows.length > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                    <TablePagination
                                        component="div"
                                        count={filteredRows.length}
                                        page={safePage}
                                        onPageChange={(_, newPage) =>
                                            setPageByYear(prev => ({ ...prev, [yearId]: newPage }))
                                        }
                                        rowsPerPage={rpp}
                                        onRowsPerPageChange={(e) => {
                                            const newRpp = parseInt(e.target.value, 10)
                                            setRowsPerPageByYear(prev => ({ ...prev, [yearId]: newRpp }))
                                            setPageByYear(prev => ({ ...prev, [yearId]: 0 }))
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
                })}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    ยกเลิก
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    disabled={saving || !canSave}
                >
                    บันทึก ({totalSelectedCount})
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default AddSubjectModal
