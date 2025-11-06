import React, { useState, useEffect, useCallback } from "react"
import { Box, Button, Paper, TextField, Typography } from "@mui/material"
import { useParams } from "next/navigation"

import AddIcon from '@mui/icons-material/Add';

import { ContactInfo, ContactType } from "@/lib/types/contact"

const ContactSection = ({ contactData }: { contactData: ContactInfo[] }) => {
    const [allContactTypes, setAllContactTypes] = useState<Array<ContactType>>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Local, editable copy of contacts for UI updates
    const [contacts, setContacts] = useState<ContactInfo[]>(contactData ?? []);

    // Per-item edit handling
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draftValue, setDraftValue] = useState<string>("");
    const [savingId, setSavingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Add-new contact per type
    const [addingTypeId, setAddingTypeId] = useState<number | null>(null);
    const [addDraft, setAddDraft] = useState<string>("");
    const [addSaving, setAddSaving] = useState<boolean>(false);

    // current account id from route
    const params = useParams<{ id: string }>();
    const accountId = params?.id;

    useEffect(() => {
        // guard against state updates after unmount
        let cancelled = false;

        // Fetch contact types and infos here if needed
        const fetchData = async () => {
            if (!cancelled) setIsLoading(true);
            try {
                const response = await fetch('/api/contact-type');
                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched contact types:", data);
                    if (!cancelled) setAllContactTypes(data?.data ?? []);
                } else {
                    console.error("Failed to fetch contact types");
                }
            } catch (error) {
                console.error("Error fetching contact types:", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, []);

    // Keep local contacts in sync with incoming props
    useEffect(() => {
        setContacts(contactData ?? []);
    }, [contactData]);

    const handleStartEdit = useCallback((id: number, currentValue: string) => {
        setEditingId(id);
        setDraftValue(currentValue ?? "");
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingId(null);
        setDraftValue("");
    }, []);

    const handleSave = useCallback(async (id: number) => {
        try {
            setSavingId(id);
            const res = await fetch(`/api/contact/${id}` , {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ detail: draftValue })
            });
            if (!res.ok) {
                console.error('Failed to update contact');
                return;
            }
            const json = await res.json();
            const updated = json?.data;
            // Update local state
            setContacts(prev => prev.map(c => c.id === id ? { ...c, value: updated?.contact_detail ?? draftValue } as ContactInfo : c));
            setEditingId(null);
            setDraftValue("");
        } catch (e) {
            console.error('Error updating contact:', e);
        } finally {
            setSavingId(null);
        }
    }, [draftValue]);

    const handleDelete = useCallback(async (id: number) => {
        try {
            setDeletingId(id);
            if(!confirm("คุณแน่ใจหรือว่าต้องการลบช่องทางติดต่อรายการนี้?")) return;

            const res = await fetch(`/api/contact/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                console.error('Failed to delete contact');
                return;
            }
            // Remove from local state
            setContacts(prev => prev.filter(c => c.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setDraftValue("");
            }
        } catch (e) {
            console.error('Error deleting contact:', e);
        } finally {
            setDeletingId(null);
        }
    }, [editingId]);


    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="h6">
                        ช่องทางติดต่อทั้งหมด
                    </Typography>
                    {/* <Box>
                        <Button variant="contained" color="warning">แก้ไข</Button>
                    </Box> */}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {isLoading ? (
                        <Typography>Loading...</Typography>
                    ) : allContactTypes.length > 0 ? (
                        allContactTypes.map((contactType) => {
                            const contactsOfType = contacts.filter((c) => c.contact_type?.id === contactType.id);

                            return (
                                <Paper variant="outlined" sx={{ p: 2 }} key={contactType.id}>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6">{contactType.type_name}</Typography>
                                        <Button
                                            variant="outlined"
                                            color="success"
                                            size="small"
                                            onClick={() => {
                                                if (addingTypeId === contactType.id) {
                                                    // toggle off
                                                    setAddingTypeId(null);
                                                    setAddDraft("");
                                                } else {
                                                    setAddingTypeId(contactType.id);
                                                    setAddDraft("");
                                                }
                                            }}
                                            disabled={addSaving}
                                        >
                                            <AddIcon />
                                        </Button>
                                    </Box>
                                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {contactsOfType.length > 0 ? (
                                            contactsOfType.map((ci) => {
                                                const isEditing = editingId === ci.id;
                                                const isSaving = savingId === ci.id;
                                                const isDeleting = deletingId === ci.id;
                                                return (
                                                    <Paper key={ci.id} variant="outlined" sx={{ p: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
                                                        <TextField
                                                            variant="standard"
                                                            value={isEditing ? draftValue : (ci.value ?? "")}
                                                            onChange={(e) => isEditing && setDraftValue(e.target.value)}
                                                            fullWidth
                                                            disabled={!isEditing}
                                                        />
                                                        <Box sx={{ gap: 1, display: 'flex', flexDirection: 'row', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                                                            {isEditing ? (
                                                                <>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="success"
                                                                        disabled={isSaving}
                                                                        onClick={() => handleSave(ci.id)}
                                                                        loading={isSaving ? true : undefined}
                                                                    >
                                                                        {/* {isSaving ? 'กำลังบันทึก…' : 'บันทึก'} */}
                                                                        บันทึก
                                                                    </Button>
                                                                    <Button
                                                                        variant="outlined"
                                                                        color="error"
                                                                        disabled={isSaving}
                                                                        onClick={handleCancelEdit}
                                                                    >
                                                                        ยกเลิก
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="outlined"
                                                                        color="warning"
                                                                        disabled={isDeleting}
                                                                        onClick={() => handleStartEdit(ci.id, ci.value ?? "")}
                                                                    >
                                                                        แก้ไข
                                                                    </Button>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="error"
                                                                        disabled={isDeleting}
                                                                        onClick={() => handleDelete(ci.id)}
                                                                        loading={isDeleting ? true : undefined}
                                                                    >
                                                                        {/* {isDeleting ? 'กำลังลบ…' : 'ลบ'} */}
                                                                        ลบ
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </Box>
                                                    </Paper>
                                                );
                                            })
                                        ) : (
                                            <Typography color="text.disabled">ไม่มีข้อมูล {contactType.type_name}</Typography>
                                        )}

                                        {addingTypeId === contactType.id && (
                                            <Paper variant="outlined" sx={{ p: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
                                                <TextField
                                                    variant="standard"
                                                    value={addDraft}
                                                    onChange={(e) => setAddDraft(e.target.value)}
                                                    placeholder={`เพิ่ม${contactType.type_name}`}
                                                    fullWidth
                                                    disabled={addSaving}
                                                />
                                                <Box sx={{ gap: 1, display: 'flex', flexDirection: 'row', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        disabled={addSaving || !addDraft.trim()}
                                                        onClick={async () => {
                                                            if (!accountId) {
                                                                console.error('Missing account id');
                                                                return;
                                                            }
                                                            try {
                                                                setAddSaving(true);
                                                                const res = await fetch(`/api/accounts/${accountId}/contact`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ detail: addDraft.trim(), type_id: contactType.id })
                                                                });
                                                                if (!res.ok) {
                                                                    console.error('Failed to create contact');
                                                                    return;
                                                                }
                                                                const created = await res.json();
                                                                // Append to local list
                                                                setContacts(prev => ([
                                                                    ...prev,
                                                                    {
                                                                        id: created?.id,
                                                                        value: created?.contact_detail ?? addDraft.trim(),
                                                                        contact_type: { id: contactType.id, type_name: contactType.type_name }
                                                                    } as ContactInfo
                                                                ]));
                                                                setAddingTypeId(null);
                                                                setAddDraft("");
                                                            } catch (e) {
                                                                console.error('Error creating contact:', e);
                                                            } finally {
                                                                setAddSaving(false);
                                                            }
                                                        }}
                                                        loading={addSaving ? true : undefined}
                                                    >
                                                        {/* {addSaving ? 'กำลังบันทึก…' : 'บันทึก'} */}
                                                        บันทึก
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        disabled={addSaving}
                                                        onClick={() => { setAddingTypeId(null); setAddDraft(""); }}
                                                    >
                                                        ยกเลิก
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        )}
                                    </Box>
                                </Paper>
                            )
                        })
                    ) : (
                        <Typography color="text.secondary">ไม่มีข้อมูลช่องทางติดต่อ</Typography>
                    )}
                </Box>

            </Box>
        </>
    )
}
export default ContactSection