"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Select,
    MenuItem,
    FormControl,
    Typography,
    Box,
} from "@mui/material";
import { Subject } from "@/lib/types/subject";
import { educationSector } from "@/lib/types/course-year";
import { LANGUAGES } from "@/lib/constants/languages";

type Props = {
    open: boolean;
    onClose: () => void;
    subjects: Subject[];
    allSubjects: Subject[];
    sectors: educationSector[];
    onEdited: () => void;
};

type EditRow = {
    id: number;
    code: string;
    name: string;
    credit: number;
    language: string;
    education_sectorId: number | null; // null if elective (course_yearId should be derived/fixed, but we only edit sector or make elective)
    isRequire: boolean; // if false -> elective
    original: Subject;
};

type ConflictData = {
    subjectName: string;
    dependentName: string;
    dependentId: number;
};

const EditSubjectModal: React.FC<Props> = ({ open, onClose, subjects, allSubjects, sectors, onEdited }) => {
    const router = useRouter();
    const [rows, setRows] = useState<EditRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [conflictAlert, setConflictAlert] = useState<{ open: boolean; conflicts: ConflictData[] } | null>(null);
    const [embedErrorModal, setEmbedErrorModal] = useState<{ open: boolean; createdCount: number }>({ open: false, createdCount: 0 });

    // Initialize rows when performing new edit
    useEffect(() => {
        if (open) {
            setRows(
                subjects.map((s) => ({
                    id: s.id,
                    code: s.code ?? "",
                    name: s.name ?? "",
                    credit: s.credit ?? 0,
                    language: s.language === "ไทย" ? "thai" : s.language === "อังกฤษ" ? "eng" : (s.language ?? "thai"),
                    education_sectorId: s.education_sectorId,
                    isRequire: s.isRequire ?? true,
                    original: s,
                }))
            );
            setConflictAlert(null);
        }
    }, [open, subjects]);

    const handleClose = () => {
        if (saving) return;
        onClose();
        setConflictAlert(null);
    };

    const getSectorLabel = (id: number | null) => {
        if (id === null) return "วิชาเลือก";
        const s = sectors.find((sec) => sec.id === id);
        return s ? `ปี ${s.year} ${s.semester !== 0 ? `เทอม ${s.semester}` : "ฤดูร้อน"}` : "Unknow";
    };

    const getSectorOrder = (sectorId: number | null): number => {
        if (sectorId === null) return 999999; // Elective usually doesn't block prerequisites in same way, or considered 'last'
        const s = sectors.find((sec) => sec.id === sectorId);
        if (!s) return 999999;
        // year * 10 + semester (0 for summer, let's say summer is after sem 2? or before? Usually 1, 2, Summer(3))
        // API seems to treat summer as 0? Let's assume standard ordering: Year, then Semester.
        // If semester 0 is summer, is it before term 1? unlikely. Usually end of year.
        // Let's assume sorting: Year asc, Semester asc.
        // If summer is 0, we might need to treat it as 3 for ordering if it comes after sem 2.
        // Or if it's "Summer before term 1"? Thai unis usually have Summer after term 2.
        // Let's use simple logic: Year * 100 + (semester === 0 ? 3 : semester)
        return (s.year ?? 0) * 100 + (s.semester === 0 ? 3 : (s.semester ?? 0));
    };

const handleSave = async (confirmedConflicts: boolean = false) => {
        setSaving(true);
        try {
            // 1. Conflict Detection
            // Check PRE relations: if we move a subject to a later/equal sector than its PRE-dependents
            // Check CO relations: if we move a subject to a different sector than its CO partners
            if (!confirmedConflicts) {
                const conflicts: ConflictData[] = [];

                for (const row of rows) {
                    const originalSubj = allSubjects.find(s => s.id === row.id);
                    if (!originalSubj) continue;

                    const newOrder = getSectorOrder(row.education_sectorId);

                    // PRE conflicts: subjects that have this subject as PRE (requiredBy PRE)
                    const preRequiredBy = (originalSubj.requiredBy ?? []).filter(r => r.type === "PRE");
                    for (const rel of preRequiredBy) {
                        const dependent = allSubjects.find(s => s.id === rel.subjectId);
                        if (!dependent) continue;
                        const dependentInEdit = rows.find(r => r.id === dependent.id);
                        const dependentSectorId = dependentInEdit ? dependentInEdit.education_sectorId : dependent.education_sectorId;
                        const dependentOrder = getSectorOrder(dependentSectorId);
                        if (newOrder >= dependentOrder) {
                            conflicts.push({
                                subjectName: row.name,
                                dependentName: dependent.name ?? "Unknown",
                                dependentId: dependent.id,
                            });
                        }
                    }

                    // CO conflicts: CO partners must stay in same sector
                    const coDeps = (originalSubj.dependencies ?? []).filter(r => r.type === "CO");
                    const coReqs = (originalSubj.requiredBy ?? []).filter(r => r.type === "CO");
                    for (const rel of [...coDeps, ...coReqs]) {
                        const partnerId = rel.type === "CO" && (rel as any).requiresId !== undefined
                            ? (rel as any).requiresId
                            : rel.subjectId;
                        const partner = allSubjects.find(s => s.id === partnerId);
                        if (!partner) continue;
                        const partnerInEdit = rows.find(r => r.id === partner.id);
                        const partnerSectorId = partnerInEdit ? partnerInEdit.education_sectorId : partner.education_sectorId;
                        if (partnerSectorId !== row.education_sectorId) {
                            conflicts.push({
                                subjectName: row.name,
                                dependentName: `${partner.name ?? "Unknown"} (CO)`,
                                dependentId: partner.id,
                            });
                        }
                    }
                }

                if (conflicts.length > 0) {
                    setConflictAlert({ open: true, conflicts });
                    setSaving(false);
                    return;
                }
            }

            // 2. Resolve Conflicts (Remove PRE/CO relations from affected subjects)
            if (confirmedConflicts && conflictAlert) {
                const depIdsToRemove = Array.from(new Set(conflictAlert.conflicts.map(c => c.dependentId)));
                await Promise.all(depIdsToRemove.map(async (depId) => {
                    const depSubj = allSubjects.find(s => s.id === depId);
                    if (!depSubj) return;
                    // Keep only relations that don't involve the moved subjects
                    const movedIds = new Set(rows.map(r => r.id));
                    const remainingPrereqs = (depSubj.dependencies ?? [])
                        .filter(r => !movedIds.has(r.requiresId))
                        .map(r => ({ requiresId: r.requiresId, type: r.type as "PRE" | "CO" }));
                    const res = await fetch(`/api/course/subject/${depId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prerequisites: remainingPrereqs }),
                    });
                    if (!res.ok) throw new Error(`Failed to remove relations from subject ID ${depId}`);
                }));
            }

            // 3. Save Edited Rows
            const changedNameIDs: number[] = [];

            await Promise.all(rows.map(async (row) => {
                const { id, code, name, credit, language, education_sectorId, isRequire } = row;

                // Construct payload — no prerequisites field here (prerequisites managed via SubjectDetailDialog)
                const payload: any = {
                    code,
                    name,
                    credit,
                    language,
                };

                // Clear old embedding if name changed
                if (name !== row.original.name) {
                    payload.name_embedding = null;
                }

                if (education_sectorId === null) {
                    payload.isRequire = false;
                    payload.course_yearId = row.original.course_yearId;
                    if (!payload.course_yearId) {
                        if (sectors.length > 0) {
                            const anySector = sectors[0];
                            // It has `course_yearId?: number`.
                            if (anySector && anySector.course_yearId) {
                                payload.course_yearId = anySector.course_yearId;
                            }
                        }
                    }
                } else {
                    payload.isRequire = true;
                    payload.education_sectorId = education_sectorId;
                    // API will derive course_yearId from sector.
                }

                const res = await fetch(`/api/course/subject/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(txt || `Failed to update subject ${id}`);
                }

                if (name !== row.original.name) {
                    changedNameIDs.push(id);
                }
            }));

            // 4. Re-embed if any name changed
            if (changedNameIDs.length > 0) {
                const embedres = await fetch("/api/embed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subject_id: changedNameIDs }),
                });

                if (!embedres.ok) {
                    console.error("Embed failed");
                    setEmbedErrorModal({ open: true, createdCount: changedNameIDs.length });
                    return;
                }
            }

            onEdited();
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
                <DialogTitle>แก้ไขข้อมูลวิชา</DialogTitle>
                <DialogContent dividers>
                    <TableContainer sx={{ maxHeight: '60vh' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 120 }}>รหัสวิชา</TableCell>
                                    <TableCell sx={{ width: 200 }}>ชื่อวิชา</TableCell>
                                    <TableCell sx={{ width: 80 }}>หน่วยกิต</TableCell>
                                    <TableCell sx={{ width: 80 }}>ภาษา</TableCell>
                                    <TableCell sx={{ width: 180 }}>ภาคการศึกษา</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row, idx) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            <TextField
                                                value={row.code}
                                                onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, code: e.target.value } : r))}
                                                size="small"
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                value={row.name}
                                                onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))}
                                                size="small"
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={row.credit}
                                                onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, credit: Number(e.target.value) } : r))}
                                                size="small"
                                                fullWidth
                                                inputProps={{ min: 0 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" fullWidth>
                                                <Select
                                                    value={row.language || "thai"}
                                                    onChange={(e) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, language: e.target.value } : r))}
                                                >
                                                    {LANGUAGES.map((l) => (
                                                        <MenuItem key={l.value} value={l.value}>
                                                            {l.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" fullWidth>
                                                <Select
                                                    value={row.education_sectorId ?? "elective"}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const newSectorId = val === "elective" ? null : Number(val);
                                                        setRows(prev => prev.map((r, i) => {
                                                            if (i === idx) {
                                                                return { ...r, education_sectorId: newSectorId };
                                                            }
                                                            return r;
                                                        }));
                                                    }}
                                                >
                                                    {sectors.map((s) => (
                                                        <MenuItem key={s.id} value={s.id}>
                                                            {`ปี ${s.year} ${s.semester !== 0 ? `เทอม ${s.semester}` : "ฤดูร้อน"}`}
                                                        </MenuItem>
                                                    ))}
                                                    <MenuItem value="elective">วิชาเลือก</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={saving}>ยกเลิก</Button>
                    <Button onClick={() => handleSave(false)} variant="contained" disabled={saving}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            {/* Conflict Alert Dialog */}
            <Dialog open={!!conflictAlert?.open} maxWidth="sm">
                <DialogTitle sx={{ color: "warning.main", display: "flex", alignItems: "center", gap: 1 }}>
                    แจ้งเตือนความขัดแย้งของรายวิชา
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography>การเปลี่ยนภาคการศึกษานี้จะทำให้เงื่อนไขวิชาที่ต้องเรียนก่อนไม่ถูกต้อง:</Typography>
                    </Box>
                    <Box sx={{ maxHeight: 200, overflowY: "auto", border: "1px solid #eee", borderRadius: 1, p: 1 }}>
                        {conflictAlert?.conflicts.map((c, i) => (
                            <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                                • <b>{c.subjectName}</b> เป็นวิชาที่ต้องเรียนก่อนของ <b>{c.dependentName}</b>
                            </Typography>
                        ))}
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Typography color="error">
                            หากดำเนินการต่อ ระบบจะทำการ<b>ลบความสัมพันธ์ (Relation)</b> เหล่านี้ออก
                        </Typography>
                        <Typography>ต้องการดำเนินการต่อหรือไม่?</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConflictAlert(null)} color="inherit">ยกเลิก</Button>
                    <Button onClick={() => handleSave(true)} variant="contained" color="error">
                        ยืนยันและลบความสัมพันธ์
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Embed Error Modal */}
            <Dialog open={embedErrorModal.open} maxWidth="sm" fullWidth>
                <DialogTitle>บันทึกวิชาสำเร็จ (แต่ AI ยังไม่รู้จักชื่อวิชาใหม่)</DialogTitle>
                <DialogContent>
                    <Typography>
                        ระบบได้บันทึกการแก้ไขข้อมูลวิชาเรียบร้อยแล้ว (รวมถึงวิชาที่เปลี่ยนชื่อจำนวน {embedErrorModal.createdCount} วิชา)
                    </Typography>
                    <Typography color="error" sx={{ mt: 1 }}>
                        อย่างไรก็ตาม เกิดข้อขัดข้องในขั้นตอน "การสอน AI" ทำให้ระบบแชทบอทยังไม่สามารถค้นหาหรือตอบคำถามโดยใช้ชื่อวิชาใหม่ได้
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        เพื่อแก้ไขปัญหานี้ กรุณาไปที่เมนู "Other" (อื่นๆ) และคลิกปุ่มทำการสอน AI ใหม่อีกครั้ง
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            *หมายเหตุ: หากยังพบปัญหา อาจเป็นเพราะเซิร์ฟเวอร์ AI กำลังปิดปรับปรุงอยู่ กรุณารอและลองใหม่อีกครั้งในภายหลัง
                        </Typography>
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'end', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => {
                            setEmbedErrorModal({ open: false, createdCount: 0 });
                            onEdited();
                            handleClose();
                        }}
                    >
                        เข้าใจแล้ว
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setEmbedErrorModal({ open: false, createdCount: 0 });
                            onEdited();
                            handleClose();
                            router.push('/admin/other');
                        }}
                    >
                        ไปยังหน้า Other
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default EditSubjectModal;
