import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'

const SessionExpiredModal = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
    return (
        <>
            <Dialog open={open}>
                <DialogTitle>Session หมดอายุ</DialogTitle>
                <DialogContent>
                    Session ของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>เข้าใจแล้ว</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default SessionExpiredModal