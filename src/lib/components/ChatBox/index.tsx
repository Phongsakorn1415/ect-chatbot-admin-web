import { Box, Divider, Paper } from '@mui/material'
import React from 'react'

const ChatBox = () => {
    return (
        <>
            <Paper elevation={2} sx={{ width: '100%', height: '70vh' }}>
                <Box sx={{ m: 2 }}>
                    Chat with ai
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                    <div>123</div>
                    <div>123</div>
                    <div>123</div>
                </Box>
            </Paper>
        </>
    )
}

export default ChatBox
