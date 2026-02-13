import { Box, Divider, Paper, Typography, TextField, InputAdornment, IconButton, Backdrop, CircularProgress, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import TextSnippetIcon from '@mui/icons-material/TextSnippet'
import TableChartIcon from '@mui/icons-material/TableChart'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import React, { useRef, useEffect, useState } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { exportToCsv, exportToTxt } from '@/lib/utils/chatExport'

const ChatBoxCard = () => {
    const { messages, isOnline, isLoading, isSending, sendMessage, clearHistory } = useChat()
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Menu State
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const openMenu = Boolean(anchorEl)

    // Dialog State
    const [openDialog, setOpenDialog] = useState(false)

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
        <Paper elevation={3} sx={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
            <Box sx={{ p: 2, color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ color: 'black', display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row' }}>
                    {/* <SmartToyIcon /> */}
                    ECT Chatbot
                    <Typography variant="body2" sx={{ color: 'warning.main', display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexDirection: 'row' }}>
                        <WarningAmberIcon /> ทดสอบการใช้งาน จะมีการเก็บประวัติแชท
                    </Typography>
                </Typography>
                <IconButton onClick={handleMenuClick} color="default" size="small">
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
                        <ListItemText>Export to TXT</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { exportToCsv(messages); handleMenuClose() }}>
                        <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Export to CSV</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { setOpenDialog(true); handleMenuClose() }} sx={{ color: 'error.main' }}>
                        <ListItemIcon><DeleteSweepIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText>Clear History</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f5f5f5' }}>
                {messages.length === 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', opacity: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Ask me anything...</Typography>
                    </Box>
                )}

                {messages.map((msg, index) => (
                    <Box
                        key={index}
                        sx={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            gap: 1,
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        }}
                    >
                        {/* <Avatar sx={{ bgcolor: msg.role === 'user' ? 'secondary.main' : 'primary.main', width: 28, height: 28 }}>
                            {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                        </Avatar> */}
                        <Paper
                            elevation={1}
                            sx={{
                                p: 1,
                                px: 2,
                                borderRadius: 2,
                                bgcolor: msg.role === 'user' ? 'primary.light' : 'white',
                                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                            }}
                        >
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                        </Paper>
                    </Box>
                ))}
                {isSending && (
                    <Box sx={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}>
                            <SmartToyIcon fontSize="small" />
                        </Avatar>
                        <Paper elevation={1} sx={{ p: 1, borderRadius: 2, bgcolor: 'white' }}>
                            <CircularProgress size={16} />
                        </Paper>
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            <Divider />

            <Box sx={{ p: 1, bgcolor: 'background.paper' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={!isOnline || isLoading}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={handleSend} disabled={!inputValue.trim() || isSending || !isOnline}>
                                        <SendIcon fontSize="small" color={inputValue.trim() ? "primary" : "action"} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>

            <Backdrop open={isLoading || !isOnline} sx={{ position: 'absolute', zIndex: 10, flexDirection: 'column', gap: 1, color: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                {isLoading ? (
                    <>
                        <CircularProgress color="inherit" size={30} />
                        <Typography variant="body2">Connecting...</Typography>
                    </>
                ) : (
                    <>
                        <SignalWifiOffIcon sx={{ fontSize: 30, color: 'error.main' }} />
                        <Typography variant="body2" color="error.light">Offline</Typography>
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
                        Are you sure you want to delete all chat history? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleClearHistoryConfirm} color="error" autoFocus>
                        Clear History
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    )
}

export default ChatBoxCard
