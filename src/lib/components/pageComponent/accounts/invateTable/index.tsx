import { Box, Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from "@mui/material";
import { useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { TableInvitationsProps } from "@/lib/types/invitations";
import { InviteSearchFilters } from "@/lib/types/invite-search";
import InviteRow from "./AccountRow";
import InviteSearchControls from "./SearchControls";

interface Props {
    data: TableInvitationsProps[];
    onRefresh?: () => Promise<void> | void;
}

const InviteTable = ({ data, onRefresh }: Props) => {
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchFilters, setSearchFilters] = useState<InviteSearchFilters>({
        searchKey: "firstName",
        searchQuery: "",
        dateRange: {
            start: null,
            end: null,
        },
        role: "",
        status: "",
    });

    // Filter data based on search criteria
    const filteredData = useMemo(() => {
        let filtered = [...data];

        // Text search filter
        if (searchFilters.searchQuery.trim() !== "") {
            const query = searchFilters.searchQuery.toLowerCase().trim();
            filtered = filtered.filter((invite) => {
                const value = invite[searchFilters.searchKey]?.toString().toLowerCase() || "";
                return value.includes(query);
            });
        }

        // Role filter
        if (searchFilters.role !== "") {
            filtered = filtered.filter((invite) => invite.role === searchFilters.role);
        }

        // Status filter
        if (searchFilters.status !== "") {
            filtered = filtered.filter((invite) => invite.status === searchFilters.status);
        }

        // Date range filter
        if (searchFilters.dateRange.start || searchFilters.dateRange.end) {
            filtered = filtered.filter((invite) => {
                const inviteDate = dayjs(invite.createdAt);
                const startDate = searchFilters.dateRange.start;
                const endDate = searchFilters.dateRange.end;

                if (startDate && endDate) {
                    return (
                        inviteDate.isAfter(startDate.startOf("day")) &&
                        inviteDate.isBefore(endDate.endOf("day"))
                    );
                } else if (startDate) {
                    return inviteDate.isAfter(startDate.startOf("day"));
                } else if (endDate) {
                    return inviteDate.isBefore(endDate.endOf("day"));
                }
                return true;
            });
        }

        return filtered;
    }, [data, searchFilters]);

    // Pagination logic
    const paginatedData = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return filteredData.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);

    const rowCountOnPage = paginatedData.length;
    const allSelectedOnPage =
        selectedItems.length > 0 &&
        selectedItems.length === rowCountOnPage &&
        paginatedData.every((item) => selectedItems.includes(item.id));
    const indeterminateOnPage =
        selectedItems.length > 0 &&
        selectedItems.length < rowCountOnPage &&
        paginatedData.some((item) => selectedItems.includes(item.id));

    const handleSelectAllOnPage = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.checked) {
                const allIds = paginatedData.map((item) => item.id);
                setSelectedItems((prev) => {
                    const newSelection = [...prev];
                    allIds.forEach((id) => {
                        if (!newSelection.includes(id)) newSelection.push(id);
                    });
                    return newSelection;
                });
            } else {
                const currentPageIds = paginatedData.map((item) => item.id);
                setSelectedItems((prev) => prev.filter((id) => !currentPageIds.includes(id)));
            }
        },
        [paginatedData]
    );

    const handleSelectRow = useCallback((id: string) => {
        setSelectedItems((prev) => {
            const isSelected = prev.includes(id);
            if (isSelected) {
                return prev.filter((itemId) => itemId !== id);
            } else {
                return [...prev, id];
            }
        });
    }, []);

    const handleApplySearch = () => {
        setSelectedItems([]);
        setPage(0);
    };

    const handleClearSearch = () => {
        setSearchFilters({
            searchKey: "firstName",
            searchQuery: "",
            dateRange: { start: null, end: null },
            role: "",
            status: "",
        });
        setSelectedItems([]);
        setPage(0);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            alert('กรุณาเลือกรายการที่ต้องการลบ');
            return;
        }
        const confirmDelete = window.confirm(`คุณต้องการลบคำเชิญที่เลือกไว้ ${selectedItems.length} รายการ หรือไม่?`);
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const response = await fetch('/api/invite', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedItems }),
            });
            const result = await response.json();
            if (response.ok) {
                alert(`ลบคำเชิญสำเร็จ ${result.deletedCount} รายการ`);
                setSelectedItems([]);
                // refresh data without reloading
                if (onRefresh) await onRefresh();
            } else {
                alert(`เกิดข้อผิดพลาด: ${result.message || 'ลบไม่สำเร็จ'}`);
            }
        } catch (error) {
            console.error('Delete invites error:', error);
            alert('เกิดข้อผิดพลาดในการลบคำเชิญ');
        } finally {
            setLoading(false);
        }
    };

    const handleResendSelected = async () => {
        if (selectedItems.length === 0) {
            alert('กรุณาเลือกรายการที่ต้องการส่งอีเมลใหม่');
            return;
        }
        const confirmResend = window.confirm(`คุณต้องการส่งอีเมลเชิญใหม่ให้ ${selectedItems.length} รายการ หรือไม่?`);
        if (!confirmResend) return;

        setLoading(true);
        try {
            const response = await fetch('/api/invite', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedItems }),
            });
            const result = await response.json();
            if (response.ok) {
                const parts: string[] = [];
                if (typeof result.resent === 'number') parts.push(`ส่งแล้ว ${result.resent}`);
                if (typeof result.regenerated === 'number') parts.push(`ออกลิงก์ใหม่ ${result.regenerated}`);
                if (typeof result.skipped === 'number' && result.skipped > 0) parts.push(`ข้าม ${result.skipped}`);
                alert(`ดำเนินการสำเร็จ: ${parts.join(', ')}`);
                setSelectedItems([]);
                // refresh data without reloading
                if (onRefresh) await onRefresh();
            } else {
                alert(`เกิดข้อผิดพลาด: ${result.message || 'ส่งอีเมลไม่สำเร็จ'}`);
            }
        } catch (error) {
            console.error('Resend invites error:', error);
            alert('เกิดข้อผิดพลาดในการส่งอีเมลใหม่');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Search Controls */}
            <InviteSearchControls
                filters={searchFilters}
                onFiltersChange={setSearchFilters}
                onApplySearch={handleApplySearch}
                onClearSearch={handleClearSearch}
            />

            {/* Action summary */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    justifyContent: { xs: "flex-start", md: "space-between" },
                    mb: 2,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>
                        แสดงผล {Math.min(page * rowsPerPage + 1, filteredData.length)}-
                        {Math.min((page + 1) * rowsPerPage, filteredData.length)} จาก {filteredData.length} คำเชิญ
                    </span>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="warning"
                        onClick={handleResendSelected}
                        disabled={loading || selectedItems.length === 0}
                    >
                        ส่งอีเมลใหม่ {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDeleteSelected}
                        disabled={loading || selectedItems.length === 0}
                    >
                        ลบ {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
                    </Button>
                </Box>
            </Box>

            <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="invite table">
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
                            <TableCell>สถานะ</TableCell>
                            <TableCell>คำนำหน้า</TableCell>
                            <TableCell>ชื่อ</TableCell>
                            <TableCell>นามสกุล</TableCell>
                            <TableCell>อีเมล</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>คนที่เชิญ</TableCell>
                            <TableCell>ถูกเชิญเมื่อ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((invite) => (
                            <InviteRow
                                key={invite.id}
                                invite={invite}
                                isSelected={selectedItems.includes(invite.id)}
                                onSelectRow={handleSelectRow}
                                loading={loading}
                            />
                        ))}
                        {paginatedData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="แถวต่อหน้า:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`}
                showFirstButton
                showLastButton
                sx={{
                    borderTop: 1,
                    borderColor: 'divider',
                    '& .MuiTablePagination-toolbar': {
                        flexWrap: 'wrap',
                        justifyContent: { xs: 'center', md: 'flex-end' },
                        gap: { xs: 0, md: 1 },
                        overflowX: 'auto',
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                        fontSize: '0.875rem',
                    },
                }}
            />
        </>
    );
};

export default InviteTable;

