import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow } from "@mui/material";
import { Subject } from "@/lib/types/subject";
import SearchControls from "./SearchControls/index";
import SearchControlsMobile from "./SearchControlsMobile/index";
import SubjectRow from "./SubjectRow/index";
import type { SearchKey } from "@/lib/types/subject-search";
import type { educationSector } from "@/lib/types/course-year";
import AddSubjectModal from "./addSubjectModal";

type AddContext =
    | { type: 'sector'; sector: educationSector }
    | { type: 'elective'; courseYearId: number | null };

type Props = {
    subjects: Subject[] | null;
    loading?: boolean;
    context: AddContext;
    sectors?: educationSector[];
    courseYearId?: number | null;
    courseYearYear?: number | null;
    onAdded?: () => void;
};

const SubjectTable: React.FC<Props> = ({ subjects, loading = false, context, sectors = [], courseYearId = null, courseYearYear = null, onAdded }) => {
    // Local data safety
    const safeSubjects: Subject[] = subjects ?? [];

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Selection state (store selected subject ids)
    const [selected, setSelected] = useState<number[]>([]);

    // Modal state
    const [openAdd, setOpenAdd] = useState(false);

    // Search state
    const [searchKey, setSearchKey] = useState<SearchKey>("code");
    const [searchQuery, setSearchQuery] = useState("");

    // Derived: filtered subjects by current search
    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return safeSubjects;
        const q = searchQuery.trim().toLowerCase();
        return safeSubjects.filter((s) => {
            if (searchKey === "code") {
                const codeStr = (s.code ?? "").toLowerCase();
                return codeStr.includes(q);
            }
            if (searchKey === "name") {
                return (s.name ?? "").toLowerCase().includes(q);
            }
            if (searchKey === "credit") {
                const creditStr = s.credit != null ? String(s.credit) : "";
                return creditStr.includes(q);
            }
            // searchKey === "language"
            const langStr = typeof s.language === "string" ? s.language : "";
            return langStr.toLowerCase().includes(q);
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

    const handleDeleteSelectedSubject = async () => {
        if (selected.length === 0) return;
        const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบวิชาที่เลือก?");
        if (!confirm) return;

        try {
            await Promise.all(
                selected.map(async (id) => {
                    const res = await fetch(`/api/course/subject/${id}`, { method: "DELETE" });
                    if (!res.ok) {
                        const msg = await res.text();
                        throw new Error(msg || `Failed to delete subject ${id}`);
                    }
                })
            );
            setSelected([]);
            onAdded?.(); // trigger refresh upstream
        } catch (error) {
            console.error("Error deleting subjects:", error);
        }
    }

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
                <SearchControls
                    searchKey={searchKey}
                    onChangeSearchKey={setSearchKey}
                    searchQuery={searchQuery}
                    onChangeSearchQuery={setSearchQuery}
                    onApply={() => setPage(0)}
                />

                <SearchControlsMobile
                    searchKey={searchKey}
                    onChangeSearchKey={setSearchKey}
                    searchQuery={searchQuery}
                    onChangeSearchQuery={setSearchQuery}
                    onApply={() => setPage(0)}
                    onClear={() => { setSearchQuery(""); setPage(0); }}
                />

                <Button variant="outlined" onClick={() => setOpenAdd(true)}>เพิ่มวิชา</Button>
                <Button variant="outlined" color="error" disabled={selected.length === 0 || loading} onClick={handleDeleteSelectedSubject}>ลบวิชาที่เลือก ({selected.length})</Button>
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
                            <TableCell>รหัสวิชา</TableCell>
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
                                        <TableCell colSpan={5} align="center">กำลังโหลด...</TableCell>
                                    </TableRow>
                                );
                            }
                            if (!subjects || safeSubjects.length === 0) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">ไม่มีข้อมูลวิชา</TableCell>
                                    </TableRow>
                                );
                            }
                            return pageRows.map((subject) => {
                                const checked = isSelected(subject.id);
                                return (
                                    <SubjectRow
                                        key={subject.id}
                                        subject={subject}
                                        checked={checked}
                                        disabled={loading}
                                        onToggle={() => handleRowToggle(subject.id)}
                                    />
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

            {/* Add Subject Modal */}
            <AddSubjectModal
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                context={context}
                sectors={sectors}
                courseYearId={courseYearId}
                courseYearYear={courseYearYear}
                onAdded={() => {
                    setOpenAdd(false);
                    onAdded?.();
                }}
            />
        </>
    );
};
export default SubjectTable;