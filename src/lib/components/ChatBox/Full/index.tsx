import { Box, Divider, TextField, Typography, InputAdornment, IconButton, Backdrop, CircularProgress, Paper, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Tooltip, RadioGroup, FormControlLabel, Radio } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import TextSnippetIcon from '@mui/icons-material/TextSnippet'
import TableChartIcon from '@mui/icons-material/TableChart'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FlagIcon from '@mui/icons-material/Flag';

import React, { useRef, useEffect, useState } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { exportToCsv, exportToTxt } from '@/lib/utils/chatExport'
import CustomAlert from '@/lib/components/customAlert'

const ChatBoxFull = () => {
    const { messages, isOnline, isLoading, isSending, sendMessage, clearHistory } = useChat()
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Menu State
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const openMenu = Boolean(anchorEl)

    // Dialog State
    const [openDialog, setOpenDialog] = useState(false)

    // Report State
    const [openReportModal, setOpenReportModal] = useState(false)
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
    const [reportReason, setReportReason] = useState('เนื้อหาไม่ถูกต้อง')
    const [otherReason, setOtherReason] = useState('')
    const [openConfirmReportDialog, setOpenConfirmReportDialog] = useState(false)
    const [alertInfo, setAlertInfo] = useState<{ message: string, severity: 'error' | 'warning' | 'info' | 'success' } | null>(null)

    const handleOpenReportModal = (id?: number) => {
        if (!id) return
        setSelectedLogId(id)
        setOpenReportModal(true)
    }

    const handleReportSubmit = () => {
        setOpenReportModal(false)
        setOpenConfirmReportDialog(true)
    }

    const handleConfirmReport = async () => {
        setOpenConfirmReportDialog(false)
        if (!selectedLogId) return

        const finalReason = reportReason === 'อื่นๆ' ? otherReason : reportReason

        try {
            const res = await fetch(`/api/chat/report/${selectedLogId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportMessage: finalReason })
            })

            if (res.ok) {
                setAlertInfo({ message: 'ส่งรายงานสำเร็จ', severity: 'success' })
            } else {
                setAlertInfo({ message: 'เกิดข้อผิดพลาดในการส่งรายงาน', severity: 'error' })
            }
        } catch (error) {
            setAlertInfo({ message: 'เกิดข้อผิดพลาดในการส่งรายงาน', severity: 'error' })
        }

        setTimeout(() => setAlertInfo(null), 3000)
        setReportReason('เนื้อหาไม่ถูกต้อง')
        setOtherReason('')
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = () => {
        if (!inputValue.trim()) return
        sendMessage(inputValue)
        setInputValue('')
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleClearHistoryConfirm = () => {
        clearHistory()
        setOpenDialog(false)
        handleMenuClose()
    }

    return (
        <Box sx={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row' }}>
                    {/* <SmartToyIcon color="primary" />  */}
                    ECT Chatbot
                    <Typography variant="body2" sx={{ color: 'warning.main', display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexDirection: 'row' }}>
                        <WarningAmberIcon /> ทดสอบการใช้งาน จะมีการเก็บประวัติแชท
                    </Typography>
                </Typography>
                <IconButton onClick={handleMenuClick}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem onClick={() => { exportToTxt(messages); handleMenuClose() }}>
                        <ListItemIcon><TextSnippetIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>บันทึกเป็น TXT</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { exportToCsv(messages); handleMenuClose() }}>
                        <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>บันทึกเป็น CSV</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { setOpenDialog(true); handleMenuClose() }} sx={{ color: 'error.main' }}>
                        <ListItemIcon><DeleteSweepIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText>ล้างประวัติการแชท</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.length === 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', opacity: 0.5 }}>
                        <Typography>เริ่มการสนทนา</Typography>
                    </Box>
                )}

                {messages.map((msg, index) => (
                    <Box
                        key={index}
                        sx={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '70%',
                            display: 'flex',
                            gap: 1,
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        }}
                    >
                        {/* <Avatar sx={{ bgcolor: msg.role === 'user' ? 'secondary.main' : 'primary.main', width: 32, height: 32 }}>
                            {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                        </Avatar> */}
                        <Paper
                            elevation={1}
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                            }}
                        >
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                        </Paper>
                        {msg.role !== 'user' && (
                            <Tooltip title="Report" placement='top' arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenReportModal(msg.logId)}
                                    sx={{
                                        height: '50%',
                                        '&:hover': {
                                            color: 'error.main',
                                            bgcolor: 'none',
                                        },
                                    }}
                                >
                                    <FlagIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                ))}
                {isSending && (
                    <Box sx={{ alignSelf: 'flex-start', maxWidth: '70%', display: 'flex', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            <SmartToyIcon fontSize="small" />
                        </Avatar>
                        <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.100' }}>
                            <CircularProgress size={20} />
                        </Paper>
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="ถามสิ่งที่อยากรู้ . . ."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={!isOnline || isLoading}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleSend} disabled={!inputValue.trim() || isSending || !isOnline}>
                                        <SendIcon color={inputValue.trim() ? "primary" : "action"} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>

            <Backdrop
                open={isLoading || !isOnline}
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer - 1,
                    flexDirection: 'column',
                    gap: 2,
                    color: '#fff',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    left: {
                        xs: 0,
                        md: '29.166667vw',
                        lg: '20.833333vw',
                        xl: '16.666667vw'
                    }
                }}
            >
                {isLoading ? (
                    <>
                        <CircularProgress color="inherit" />
                        <Typography variant="h6">กำลังเชื่อมต่อกับ AI...</Typography>
                    </>
                ) : (
                    <>
                        <SignalWifiOffIcon sx={{ fontSize: 48, color: 'error.main' }} />
                        <Typography variant="h6" color="error.light">การเชื่อมต่อล้มเหลว</Typography>
                        <Typography variant="body2">AI offline</Typography>
                    </>
                )}
            </Backdrop>

            {/* Clear History Confirmation Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
            >
                <DialogTitle>{"Clear Chat History?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการแชททั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>ยกเลิก</Button>
                    <Button onClick={handleClearHistoryConfirm} color="error" autoFocus>
                        ลบประวัติการแชท
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Report Modal */}
            <Dialog open={openReportModal} onClose={() => setOpenReportModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>รายงานข้อความ</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        กรุณาเลือกสาเหตุที่คุณต้องการรายงานข้อความนี้:
                    </DialogContentText>
                    <RadioGroup
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                    >
                        <FormControlLabel value="ไม่สามารถตอบคำถามได้" control={<Radio />} label="ไม่สามารถตอบคำถามได้" />
                        <FormControlLabel value="เนื้อหาของคำตอบไม่ถูกต้อง" control={<Radio />} label="เนื้อหาของคำตอบไม่ถูกต้อง" />
                        <FormControlLabel value="ไม่สามารถอ่านเนื้อหาของคำตอบได้" control={<Radio />} label="ไม่สามารถอ่านเนื้อหาของคำตอบได้" />
                        <FormControlLabel value="เนื้อหาไม่เหมาะสม" control={<Radio />} label="เนื้อหาไม่เหมาะสม" />
                        <FormControlLabel value="อื่นๆ" control={<Radio />} label="อื่นๆ" />
                    </RadioGroup>
                    {reportReason === 'อื่นๆ' && (
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="โปรดระบุสาเหตุ..."
                            value={otherReason}
                            onChange={(e) => setOtherReason(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenReportModal(false)}>ยกเลิก</Button>
                    <Button
                        onClick={handleReportSubmit}
                        variant="contained"
                        color="error"
                        disabled={reportReason === 'อื่นๆ' && !otherReason.trim()}
                    >
                        รายงาน
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Report Dialog */}
            <Dialog open={openConfirmReportDialog} onClose={() => setOpenConfirmReportDialog(false)}>
                <DialogTitle>ยืนยันการส่งรายงาน</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        คุณแน่ใจหรือไม่ว่าต้องการส่งรายงานนี้?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmReportDialog(false)}>ยกเลิก</Button>
                    <Button onClick={handleConfirmReport} variant="contained" color="error" autoFocus>
                        ยืนยัน
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Custom Alert */}
            {alertInfo && (
                <CustomAlert message={alertInfo.message} severity={alertInfo.severity} />
            )}
        </Box>
    )
}

export default ChatBoxFull