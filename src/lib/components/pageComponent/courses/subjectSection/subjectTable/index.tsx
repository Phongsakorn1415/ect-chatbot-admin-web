import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, capitalize, Checkbox, FormControl, FormGroup, InputLabel, Menu, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from "@mui/material";
import { Subject } from "@/lib/types/subject";

type Props = {
    subjects: Subject[] | null;
    loading?: boolean;
};

const SubjectTable: React.FC<Props> = ({ subjects, loading = false }) => {
    // Local data safety
    const safeSubjects: Subject[] = subjects ?? [];

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Selection state (store selected subject ids)
    const [selected, setSelected] = useState<number[]>([]);

    // Search state
    const [searchKey, setSearchKey] = useState<"id" | "name" | "credit" | "language">("name");
    const [searchQuery, setSearchQuery] = useState("");

    // Mobile dropdown (menu) anchor
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(menuAnchor);
    const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => setMenuAnchor(e.currentTarget);
    const handleCloseMenu = () => setMenuAnchor(null);

    // Derived: filtered subjects by current search
    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return safeSubjects;
        const q = searchQuery.trim().toLowerCase();
        return safeSubjects.filter((s) => {
            if (searchKey === "name") {
                return (s.name ?? "").toLowerCase().includes(q);
            }
            if (searchKey === "credit") {
                const creditStr = s.credit != null ? String(s.credit) : "";
                return creditStr.includes(q);
            }
            if (searchKey === "language") {
                const langStr = typeof s.language === "string" ? s.language : "";
                return langStr.toLowerCase().includes(q);
            }
            // searchKey === "id" (ใช้เป็นรหัสวิชา)
            const idStr = s.id != null ? String(s.id) : "";
            return idStr.includes(q);
        });
    }, [safeSubjects, searchKey, searchQuery]);

    // Keep page and selection valid when data size changes
    useEffect(() => {
        // Pagination should respect the filtered list length
        const maxPage = Math.max(0, Math.ceil(filteredSubjects.length / rowsPerPage) - 1);
        if (page > maxPage) setPage(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredSubjects.length, rowsPerPage]);

    useEffect(() => {
        // Keep selections only for subjects that still exist in the full dataset
        const idSet = new Set(safeSubjects.map((s) => s.id));
        setSelected((prev) => prev.filter((id) => idSet.has(id)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeSubjects.length]);

    // Reset to first page on search change
    useEffect(() => {
        setPage(0);
    }, [searchKey, searchQuery]);

    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    const pageRows = filteredSubjects.slice(start, end);

    const isSelected = (id: number | undefined) => (id !== undefined ? selected.includes(id) : false);

    const handleSelectAllOnPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const pageIds = pageRows.map((s) => s.id);
            setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
        } else {
            const pageIdSet = new Set(pageRows.map((s) => s.id));
            setSelected((prev) => prev.filter((id) => !pageIdSet.has(id)));
        }
    };

    const handleRowToggle = (id: number | undefined) => {
        if (id === undefined) return;
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const numSelectedOnPage = pageRows.filter((r) => isSelected(r.id)).length;
    const rowCountOnPage = pageRows.length;
    const allSelectedOnPage = rowCountOnPage > 0 && numSelectedOnPage === rowCountOnPage;
    const indeterminateOnPage = numSelectedOnPage > 0 && numSelectedOnPage < rowCountOnPage;

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <>
            <Box sx={{ pt: 1, pb: 2, display: "flex", flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: { sx: 'flex-start', md: 'flex-end' } }}>
                {/* Desktop/tablet search controls */}
                <FormGroup sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: "row", alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id="search-key-label">ค้นหาด้วย</InputLabel>
                        <Select
                            labelId="search-key-label"
                            label="ค้นหาด้วย"
                            value={searchKey}
                            onChange={(e) => setSearchKey(e.target.value as "id" | "name" | "credit" | "language")}
                        >
                            <MenuItem value="id">รหัสวิชา</MenuItem>
                            <MenuItem value="name">ชื่อวิชา</MenuItem>
                            <MenuItem value="credit">หน่วยกิต</MenuItem>
                            <MenuItem value="language">ภาษาที่ใช้สอน</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        label={searchKey === 'id' ? 'ค้นหาด้วยรหัสวิชา' : searchKey === 'name' ? 'ค้นหาด้วยชื่อวิชา' : searchKey === 'credit' ? 'ค้นหาด้วยหน่วยกิต' : 'ค้นหาด้วยภาษาที่ใช้สอน'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button variant="contained" onClick={() => setPage(0)}>ค้นหา</Button>
                </FormGroup>

                {/* Mobile: collapse into a dropdown menu to hide search controls */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
                    <Button variant="outlined" onClick={handleOpenMenu} fullWidth>ค้นหา</Button>
                    <Menu anchorEl={menuAnchor} open={openMenu} onClose={handleCloseMenu} keepMounted>
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 260 }}>
                            <FormControl size="small">
                                <InputLabel id="mobile-search-key-label">ค้นหาด้วย</InputLabel>
                                <Select
                                    labelId="mobile-search-key-label"
                                    label="ค้นหาด้วย"
                                    value={searchKey}
                                    onChange={(e) => setSearchKey(e.target.value as "id" | "name" | "credit" | "language")}
                                >
                                    <MenuItem value="id">รหัสวิชา</MenuItem>
                                    <MenuItem value="name">ชื่อวิชา</MenuItem>
                                    <MenuItem value="credit">หน่วยกิต</MenuItem>
                                    <MenuItem value="language">ภาษาที่ใช้สอน</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                size="small"
                                label={searchKey === 'id' ? 'ค้นหาด้วยรหัสวิชา' : searchKey === 'name' ? 'ค้นหาด้วยชื่อวิชา' : searchKey === 'credit' ? 'ค้นหาด้วยหน่วยกิต' : 'ค้นหาด้วยภาษาที่ใช้สอน'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button onClick={() => { setSearchQuery(""); setPage(0); }}>ล้าง</Button>
                                <Button variant="contained" onClick={() => { setPage(0); handleCloseMenu(); }}>ใช้</Button>
                            </Box>
                        </Box>
                    </Menu>
                </Box>

                <Button variant="outlined">เพิ่มวิชา</Button>
                <Button variant="outlined" color="error" disabled={selected.length === 0 || loading} onClick={() => alert(`ลบวิชา ${selected.join(", ")}`)}>ลบวิชาที่เลือก ({selected.length})</Button>
            </Box>
            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={indeterminateOnPage}
                                    checked={allSelectedOnPage}
                                    onChange={handleSelectAllOnPage}
                                    disabled={loading || rowCountOnPage === 0}
                                    inputProps={{ "aria-label": "select all on page" }}
                                />
                            </TableCell>
                            <TableCell>ชื่อวิชา</TableCell>
                            <TableCell>หน่วยกิต</TableCell>
                            <TableCell>สอนด้วยภาษา</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(() => {
                            if (loading) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">กำลังโหลด...</TableCell>
                                    </TableRow>
                                );
                            }
                            if (!subjects || safeSubjects.length === 0) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">ไม่มีข้อมูลวิชา</TableCell>
                                    </TableRow>
                                );
                            }
                            return pageRows.map((subject) => {
                                const checked = isSelected(subject.id);
                                return (
                                    <TableRow
                                        key={subject.id}
                                        hover
                                        role="checkbox"
                                        aria-checked={checked}
                                        selected={checked}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={checked}
                                                onChange={() => handleRowToggle(subject.id)}
                                                disabled={loading}
                                            />
                                        </TableCell>
                                        <TableCell>{subject.name ?? '-'}</TableCell>
                                        <TableCell>{subject.credit ?? '-'}</TableCell>
                                        <TableCell>{capitalize((subject.language as string) ?? '-') }</TableCell>
                                    </TableRow>
                                );
                            });
                        })()}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={filteredSubjects.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 20, 50]}
                labelRowsPerPage="จำนวนวิชาต่อหน้า"
            />
        </>
    );
};
export default SubjectTable;