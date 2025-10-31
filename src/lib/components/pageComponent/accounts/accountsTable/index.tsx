import { Box, Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from "@mui/material"
import { useState, useCallback, useMemo } from "react"
import dayjs from "dayjs"
import { TableAccountProps } from "@/lib/types/accounts"
import { AccountSearchFilters } from "@/lib/types/account-search"
import AccountRow from "./AccountRow"
import AccountSearchControls from "./SearchControls"

const AccountsTable = ({ data }: { data: TableAccountProps[] }) => {
    const [loading, setLoading] = useState(false)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [searchFilters, setSearchFilters] = useState<AccountSearchFilters>({
        searchKey: 'firstName',
        searchQuery: '',
        dateRange: {
            start: null,
            end: null
        },
        role: ''
    })

    // Filter data based on search criteria
    const filteredData = useMemo(() => {
        let filtered = [...data]

        // Text search filter
        if (searchFilters.searchQuery.trim() !== '') {
            const query = searchFilters.searchQuery.toLowerCase().trim()
            filtered = filtered.filter(account => {
                const value = account[searchFilters.searchKey]?.toString().toLowerCase() || ''
                return value.includes(query)
            })
        }

        // Role filter
        if (searchFilters.role !== '') {
            filtered = filtered.filter(account => account.role === searchFilters.role)
        }

        // Date range filter
        if (searchFilters.dateRange.start || searchFilters.dateRange.end) {
            filtered = filtered.filter(account => {
                const accountDate = dayjs(account.createdAt)
                const startDate = searchFilters.dateRange.start
                const endDate = searchFilters.dateRange.end

                if (startDate && endDate) {
                    return accountDate.isAfter(startDate.startOf('day')) && accountDate.isBefore(endDate.endOf('day'))
                } else if (startDate) {
                    return accountDate.isAfter(startDate.startOf('day'))
                } else if (endDate) {
                    return accountDate.isBefore(endDate.endOf('day'))
                }
                return true
            })
        }

        return filtered
    }, [data, searchFilters])

    // Pagination logic
    const paginatedData = useMemo(() => {
        const startIndex = page * rowsPerPage
        return filteredData.slice(startIndex, startIndex + rowsPerPage)
    }, [filteredData, page, rowsPerPage])

    
    // Filter out SUPER_ADMIN accounts for selection from current page
    const selectableAccounts = paginatedData.filter(account => account.role !== 'SUPER_ADMIN')
    const rowCountOnPage = selectableAccounts.length
    const allSelectedOnPage = selectedItems.length > 0 && selectedItems.length === rowCountOnPage && 
                            selectableAccounts.every(account => selectedItems.includes(account.id))
    const indeterminateOnPage = selectedItems.length > 0 && selectedItems.length < rowCountOnPage &&
                              selectableAccounts.some(account => selectedItems.includes(account.id))

    const handleSelectAllOnPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            // Select all selectable items on current page (excluding SUPER_ADMIN)
            const allSelectableIds = selectableAccounts.map(item => item.id)
            setSelectedItems(prev => {
                // Add current page selectable ids to existing selection
                const newSelection = [...prev]
                allSelectableIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id)
                    }
                })
                return newSelection
            })
        } else {
            // Remove current page selectable ids from selection
            const currentPageIds = selectableAccounts.map(item => item.id)
            setSelectedItems(prev => prev.filter(id => !currentPageIds.includes(id)))
        }
    }, [selectableAccounts])

    const handleSelectRow = useCallback((id: string) => {
        setSelectedItems(prev => {
            const isSelected = prev.includes(id)
            if (isSelected) {
                return prev.filter(itemId => itemId !== id)
            } else {
                return [...prev, id]
            }
        })
    }, [])

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            alert('กรุณาเลือกบัญชีที่ต้องการลบ')
            return
        }

        const confirmDelete = window.confirm(`คุณต้องการลบบัญชีที่เลือกไว้ ${selectedItems.length} บัญชี หรือไม่?`)
        if (!confirmDelete) return

        setLoading(true)
        try {
            const response = await fetch('/api/accounts', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: selectedItems }),
            })

            const result = await response.json()

            if (response.ok) {
                alert(`ลบบัญชีสำเร็จ ${result.deletedCount} บัญชี`)
                setSelectedItems([])
                // Refresh the page or call a refresh function
                window.location.reload()
            } else {
                alert(`เกิดข้อผิดพลาด: ${result.message}`)
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert('เกิดข้อผิดพลาดในการลบบัญชี')
        } finally {
            setLoading(false)
        }
    }

    const handleApplySearch = () => {
        // Clear selection when applying new search
        setSelectedItems([])
        setPage(0) // Reset to first page
    }

    const handleClearSearch = () => {
        setSearchFilters({
            searchKey: 'firstName',
            searchQuery: '',
            dateRange: {
                start: null,
                end: null
            },
            role: ''
        })
        setSelectedItems([])
        setPage(0) // Reset to first page
    }

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0) // Reset to first page when changing rows per page
    }

    return (
        <>
            {/* Search Controls */}
            <AccountSearchControls
                filters={searchFilters}
                onFiltersChange={setSearchFilters}
                onApplySearch={handleApplySearch}
                onClearSearch={handleClearSearch}
            />

            {/* Action Buttons */}
            <Box sx={{ display: "flex", flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: { xs: 'flex-start', md: 'space-between' }, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>แสดงผล {Math.min((page * rowsPerPage) + 1, filteredData.length)}-{Math.min((page + 1) * rowsPerPage, filteredData.length)} จาก {filteredData.length} บัญชี</span>
                </Box>
                <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleDeleteSelected}
                    disabled={loading || selectedItems.length === 0}
                >
                    ลบ {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
                </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="sticky table">
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
                            <TableCell>คำนำหน้า</TableCell>
                            <TableCell>ชื่อ</TableCell>
                            <TableCell>นามสกุล</TableCell>
                            <TableCell>อีเมล</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>เข้าร่วมเมื่อ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((account) => (
                            <AccountRow
                                key={account.id}
                                account={account}
                                isSelected={selectedItems.includes(account.id)}
                                onSelectRow={handleSelectRow}
                                loading={loading}
                            />
                        ))}
                        {paginatedData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="แถวต่อหน้า:"
                labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
                }
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
                        fontSize: '0.875rem'
                    }
                }}
            />
        </>
    )
}
export default AccountsTable