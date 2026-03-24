'use client'

import React, { useEffect, useState } from 'react'
import {
    Box, Paper, Grid, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, Button,
    CircularProgress, TablePagination
} from '@mui/material'

export interface ChatLog {
    id: number;
    userMessage: string | null;
    aiResponse: string | null;
    toolUsed: string | null;
    toolResult: string | null;
    toolsArguments: string | null;
    chatHistory: string | null;
    createdAt: string;
    reportedAt: string | null;
    reportMessage: string | null;
}

interface LogsSectionProps {
    logs: ChatLog[]
    loading: boolean
    searchDates: { startDate: string | null; endDate: string | null }
    selectedRows: number[]
    setSelectedRows: React.Dispatch<React.SetStateAction<number[]>>
    refreshKey: number
}

const LogsSection: React.FC<LogsSectionProps> = ({ logs, loading, searchDates, selectedRows, setSelectedRows, refreshKey }) => {
    const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    const displayedLogs = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

    useEffect(() => {
        setPage(0)
    }, [logs])

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelected = logs.map((n) => n.id)
            setSelectedRows(newSelected)
            return
        }
        setSelectedRows([])
    }

    const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
        event.stopPropagation()
        const selectedIndex = selectedRows.indexOf(id)
        let newSelected: number[] = []

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedRows, id)
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedRows.slice(1))
        } else if (selectedIndex === selectedRows.length - 1) {
            newSelected = newSelected.concat(selectedRows.slice(0, -1))
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedRows.slice(0, selectedIndex),
                selectedRows.slice(selectedIndex + 1),
            )
        }
        setSelectedRows(newSelected)
    }

    const handleRowClick = (log: ChatLog) => {
        setSelectedLog(log)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedLog(null)
    }

    const isSelected = (id: number) => selectedRows.indexOf(id) !== -1

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>

                <TableContainer>
                    <Table size="medium">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        color="primary"
                                        indeterminate={selectedRows.length > 0 && selectedRows.length < logs.length}
                                        checked={logs.length > 0 && selectedRows.length === logs.length}
                                        onChange={handleSelectAllClick}
                                    />
                                </TableCell>
                                <TableCell><strong>ปัญหาที่แจ้ง</strong></TableCell>
                                <TableCell><strong>แจ้งปัญหาเมื่อ</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                        ไม่มีข้อมูล
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedLogs.map((log) => {
                                    const isItemSelected = isSelected(log.id)
                                    return (
                                        <TableRow
                                            hover
                                            onClick={() => handleRowClick(log)}
                                            role="checkbox"
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            key={log.id}
                                            selected={isItemSelected}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    checked={isItemSelected}
                                                    onClick={(event) => handleClick(event, log.id)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {log.reportMessage || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {log.reportedAt ? new Date(log.reportedAt).toLocaleString('th-TH') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    component="div"
                    count={logs.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="แสดง:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`}
                />
            </Paper>

            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>รายละเอียด Chat Log</DialogTitle>
                <DialogContent dividers>
                    {selectedLog && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Report Message</Typography>
                                <Typography variant="h5" sx={{ whiteSpace: 'pre-wrap' }}>{selectedLog.reportMessage || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Reported At</Typography>
                                <Typography variant="body1">
                                    {selectedLog.reportedAt ? new Date(selectedLog.reportedAt).toLocaleString('th-TH') : '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">User Message</Typography>
                                <Typography variant="body1">{selectedLog.userMessage || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">AI Response</Typography>
                                {/* <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedLog.aiResponse || '-'}</Typography> */}
                                <Box sx={{ p: 1, backgroundColor: 'action.hover', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                        {selectedLog.aiResponse || '-'}
                                    </pre>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Tool Used</Typography>
                                <Typography variant="body1">{selectedLog.toolUsed || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Tools Arguments</Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{selectedLog.toolsArguments || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Tool Result</Typography>
                                {/* <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{selectedLog.toolResult || '-'}</Typography> */}
                                <Box sx={{ p: 1, backgroundColor: 'action.hover', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                        {selectedLog.toolResult || '-'}
                                    </pre>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Chat History</Typography>
                                <Box sx={{ p: 1, backgroundColor: 'action.hover', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                        {selectedLog.chatHistory || '-'}
                                    </pre>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="primary">ปิด</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default LogsSection