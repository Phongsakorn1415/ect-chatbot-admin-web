'use client'

import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, Paper, TextField, Typography } from '@mui/material'
import React, { useState, useEffect } from 'react'

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const ManageContactType = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
    const [contactTypeData, setContactTypeData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(0);
    const [newTypeName, setNewTypeName] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const fetchContactTypeData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/contact-type');
            const data = await res.json();
            if (res.ok && data.data) {
                setContactTypeData(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsAdding(0);
        setNewTypeName([]);
        setEditId(null);
        setEditName('');
        fetchContactTypeData();
        onClose();
    };

    const handleAddContactType = async (index: number) => {
        const name = newTypeName[index]?.trim();
        if (!name) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/contact-type', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: name })
            });

            if (res.ok) {
                // Remove only the saved row, keep the rest
                setNewTypeName(prev => prev.filter((_, i) => i !== index));
                setIsAdding(prev => prev - 1);
                fetchContactTypeData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelAdd = (index: number) => {
        setNewTypeName(prev => prev.filter((_, i) => i !== index));
        setIsAdding(prev => prev - 1);
    };

    const handleEditContactType = (id: number, currentName: string) => {
        setEditId(id);
        setEditName(currentName);
    };

    const handleSaveEdit = async () => {
        if (!editId || !editName.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/contact-type/${editId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: editName.trim() })
            });
            if (res.ok) {
                setEditId(null);
                setEditName('');
                fetchContactTypeData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteContactType = async (id: number, typeName: string) => {
        if (!confirm('คุณแน่ใจว่าต้องการลบประเภทข้อมูลนี้ใช่ไหม?')) return;
        try {
            const res = await fetch(`/api/contact-type/${id}`, { method: 'DELETE' });

            if (res.status === 409) {
                const data = await res.json();
                const count = data.contactCount ?? 0;
                if (!confirm(`มีช่องทางติดต่อของ ${typeName} ทั้งหมด ${count} ช่องทาง\nต้องการลบการติดต่อประเภทนี้พร้อมกับช่องทางติดต่อหรือไม่?`)) return;
                const forceRes = await fetch(`/api/contact-type/${id}?force=true`, { method: 'DELETE' });
                if (forceRes.ok) fetchContactTypeData();
                return;
            }

            if (res.ok) fetchContactTypeData();
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (open) {
            fetchContactTypeData();
        }
    }, [open]);

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
                <DialogTitle component={'div'} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='h5' sx={{ my: 1 }}>
                        จัดการประเภทข้อมูลของช่องทางการติดต่อ
                    </Typography>
                    <CloseIcon onClick={handleClose} sx={{ cursor: 'pointer', mx: 1, fontSize: 30 }} />
                </DialogTitle>
                <Divider sx={{ mx: 2 }} />
                <DialogContent>
                    <Box>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                                <CircularProgress />
                            </Box>
                        ) : contactTypeData.length === 0 && isAdding < 1 ? (
                            <Paper elevation={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                                <Typography variant='h6'>ไม่พบข้อมูล</Typography>
                            </Paper>
                        ) : (
                            contactTypeData.map((item) => (
                                <Paper key={item.id} elevation={3} sx={{ p: 2, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '4vh' }}>
                                    {editId === item.id ? (
                                        <>
                                            <TextField
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                size='small'
                                                fullWidth
                                                sx={{ mr: 2 }}
                                                autoFocus
                                                disabled={isSubmitting}
                                            />
                                            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                                <Button variant='outlined' color='inherit' size='small' sx={{ height: '40px' }} onClick={() => { setEditId(null); setEditName(''); }} disabled={isSubmitting}>ยกเลิก</Button>
                                                <Button variant='contained' color='warning' size='small' sx={{ height: '40px' }} onClick={handleSaveEdit} disabled={isSubmitting || !editName.trim()}>บันทึก</Button>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <Box>
                                                <Typography variant='h6'>{item.type_name}</Typography>
                                            </Box>
                                            <Box>
                                                <IconButton color='warning' onClick={() => handleEditContactType(item.id, item.type_name)}><EditOutlinedIcon /></IconButton>
                                                <IconButton color='error' onClick={() => handleDeleteContactType(item.id, item.type_name)}><DeleteOutlinedIcon /></IconButton>
                                            </Box>
                                        </>
                                    )}
                                </Paper>
                            ))
                        )}
                        {isAdding >= 1 && (
                            Array.from({ length: isAdding }).map((_, index) => (
                                <Paper key={index} elevation={3} sx={{ p: 2, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '4vh' }}>
                                    <TextField
                                        label="ชื่อประเภทข้อมูล"
                                        value={newTypeName[index] ?? ''}
                                        onChange={(e) => setNewTypeName(prev => {
                                            const updated = [...prev];
                                            updated[index] = e.target.value;
                                            return updated;
                                        })}
                                        fullWidth
                                        sx={{ mr: 2 }}
                                        autoFocus={index === isAdding - 1}
                                        disabled={isSubmitting}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                        <Button variant='outlined' color='error' sx={{ height: '56px' }} onClick={() => handleCancelAdd(index)} disabled={isSubmitting}>ยกเลิก</Button>
                                        <Button variant='contained' color='primary' sx={{ height: '56px' }} onClick={() => handleAddContactType(index)} disabled={isSubmitting || !newTypeName[index]?.trim()}>เพิ่ม</Button>
                                    </Box>
                                </Paper>
                            ))
                        )}
                        <Box onClick={() => setIsAdding(isAdding + 1)} sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 'auto',
                            p: 2,
                            border: '2px dashed #ccc',
                            borderRadius: 1,
                            cursor: 'pointer',
                            mt: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                borderColor: '#999'
                            }
                        }}>
                            <AddIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant='h6' sx={{ color: 'text.secondary' }}>เพิ่มประเภทข้อมูล</Typography>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ManageContactType