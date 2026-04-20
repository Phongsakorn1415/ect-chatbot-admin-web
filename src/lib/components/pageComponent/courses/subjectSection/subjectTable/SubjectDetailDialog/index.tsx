"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import { Subject, SubjectRelation } from "@/lib/types/subject";
import { educationSector } from "@/lib/types/course-year";
import { LANGUAGES } from "@/lib/constants/languages";

type Props = {
  open: boolean;
  subject: Subject | null;
  allSubjects: Subject[];
  sectors: educationSector[];
  onClose: () => void;
  onUpdated: () => void;
};

type EditFields = {
  code: string;
  name: string;
  credit: number;
  language: string;
  education_sectorId: number | null;
};

const getSectorOrder = (year: number | null, semester: number | null) =>
  (year ?? 0) * 100 + (semester === 0 ? 3 : (semester ?? 0));

const getSectorOrderById = (sectorId: number | null, sectors: educationSector[]) => {
  if (sectorId === null) return 999999;
  const s = sectors.find((sec) => sec.id === sectorId);
  return s ? getSectorOrder(s.year, s.semester) : 999999;
};

const sectorLabel = (id: number | null, sectors: educationSector[]) => {
  if (id === null) return "วิชาเลือก";
  const s = sectors.find((sec) => sec.id === id);
  return s ? `ปี ${s.year} ${s.semester !== 0 ? `เทอม ${s.semester}` : "ฤดูร้อน"}` : "Unknown";
};

const SubjectDetailDialog: React.FC<Props> = ({
  open,
  subject,
  allSubjects,
  sectors,
  onClose,
  onUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<EditFields>({
    code: "",
    name: "",
    credit: 0,
    language: "thai",
    education_sectorId: null,
  });

  // PRE prerequisites (subjectId = this, type = PRE)
  const [preList, setPreList] = useState<{ requiresId: number; type: "PRE" }[]>([]);
  // CO co-requisites (both directions merged)
  const [coList, setCoList] = useState<{ requiresId: number; sourceSubjectId: number }[]>([]);
  // CO relations removed from other subjects — need to be patched on save
  const [removedCOOtherSide, setRemovedCOOtherSide] = useState<{ requiresId: number; sourceSubjectId: number }[]>([]);

  const [saving, setSaving] = useState(false);

  // Initialise state from subject prop whenever dialog opens or subject changes
  useEffect(() => {
    if (!subject || !open) return;
    setIsEditing(false);
    setEditFields({
      code: subject.code ?? "",
      name: subject.name ?? "",
      credit: subject.credit ?? 0,
      language:
        subject.language === "ไทย"
          ? "thai"
          : subject.language === "อังกฤษ"
            ? "eng"
            : (subject.language ?? "thai"),
      education_sectorId: subject.education_sectorId,
    });

    // PRE: from dependencies where type === PRE
    const pre = (subject.dependencies ?? [])
      .filter((r) => r.type === "PRE")
      .map((r) => ({ requiresId: r.requiresId, type: "PRE" as const }));
    setPreList(pre);

    // CO: merge both directions
    // dependencies CO (this subject is the one that declared it)
    const coDeps = (subject.dependencies ?? [])
      .filter((r) => r.type === "CO")
      .map((r) => ({ requiresId: r.requiresId, sourceSubjectId: subject.id }));
    // requiredBy CO (other subject declared it, this subject is the requiresId)
    const coReqs = (subject.requiredBy ?? [])
      .filter((r) => r.type === "CO")
      .map((r) => ({ requiresId: r.subjectId, sourceSubjectId: r.subjectId }));

    // Deduplicate by requiresId
    const seen = new Set<number>();
    const merged: { requiresId: number; sourceSubjectId: number }[] = [];
    for (const item of [...coDeps, ...coReqs]) {
      if (!seen.has(item.requiresId)) {
        seen.add(item.requiresId);
        merged.push(item);
      }
    }
    setCoList(merged);
    setRemovedCOOtherSide([]);
  }, [subject, open]);

  if (!subject) return null;

  const currentSectorId = isEditing ? editFields.education_sectorId : subject.education_sectorId;
  const currentOrder = getSectorOrderById(currentSectorId, sectors);

  // Subjects valid as PRE: must be in an earlier sector
  const validPRE = allSubjects.filter((s) => {
    if (s.id === subject.id) return false;
    if (preList.some((p) => p.requiresId === s.id)) return false; // already added
    const order = getSectorOrderById(s.education_sectorId, sectors);
    return order < currentOrder;
  });

  // Subjects valid as CO: must be in the same sector
  const validCO = allSubjects.filter((s) => {
    if (s.id === subject.id) return false;
    if (coList.some((c) => c.requiresId === s.id)) return false; // already added
    return s.education_sectorId === currentSectorId && currentSectorId !== null;
  });

  // Subjects that require this subject as PRE (read-only display)
  const requiredByPRE = (subject.requiredBy ?? []).filter((r) => r.type === "PRE");

  const handleClose = () => {
    if (saving) return;
    setIsEditing(false);
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build prerequisites payload from preList + coList
      const prerequisites = [
        ...preList.map((p) => ({ requiresId: p.requiresId, type: "PRE" as const })),
        ...coList
          .filter((c) => c.sourceSubjectId === subject.id)
          .map((c) => ({ requiresId: c.requiresId, type: "CO" as const })),
      ];

      const payload: any = {
        code: editFields.code,
        name: editFields.name,
        credit: editFields.credit,
        language: editFields.language,
        prerequisites,
      };

      if (editFields.education_sectorId === null) {
        payload.isRequire = false;
        payload.course_yearId = subject.course_yearId;
      } else {
        payload.isRequire = true;
        payload.education_sectorId = editFields.education_sectorId;
      }

      if (editFields.name !== subject.name) {
        payload.name_embedding = null;
      }

      const res = await fetch(`/api/course/subject/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to update subject");
      }

      // Patch other subjects whose CO relation to this subject was removed
      for (const removed of removedCOOtherSide) {
        const ownerSubject = allSubjects.find((s) => s.id === removed.sourceSubjectId);
        if (!ownerSubject) continue;
        const ownerPrereqs = (ownerSubject.dependencies ?? [])
          .filter((r) => !(r.type === "CO" && r.requiresId === subject.id))
          .map((r) => ({ requiresId: r.requiresId, type: r.type as "PRE" | "CO" }));
        await fetch(`/api/course/subject/${removed.sourceSubjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prerequisites: ownerPrereqs }),
        });
      }

      // Re-embed if name changed
      if (editFields.name !== subject.name) {
        await fetch("/api/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_id: [subject.id] }),
        });
      }

      setIsEditing(false);
      onUpdated();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCO = (item: { requiresId: number; sourceSubjectId: number }) => {
    // If the relation is owned by another subject, track it for patching on save
    if (item.sourceSubjectId !== subject.id) {
      setRemovedCOOtherSide((prev) => [...prev, item]);
    }
    setCoList((prev) => prev.filter((c) => c.requiresId !== item.requiresId));
  };

  const subjectName = (id: number) => {
    const s = allSubjects.find((x) => x.id === id);
    return s ? `${s.code} ${s.name}` : `id=${id}`;
  };

  const isElective = subject.isRequire === false;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle component={'div'} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        <Typography variant="h6">
          {isEditing ? "แก้ไขวิชา" : "รายละเอียดวิชา"}
        </Typography>
        <Stack direction="row" spacing={1}>
          {!isEditing && (
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              onClick={() => setIsEditing(true)}
            >
              แก้ไข
            </Button>
          )}
          {isEditing && (
            <>
              <Button size="small" onClick={() => setIsEditing(false)} disabled={saving}>
                ยกเลิก
              </Button>
              <Button size="small" variant="contained" onClick={handleSave} disabled={saving}>
                บันทึก
              </Button>
            </>
          )}
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* Basic Info */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            mb: 2,
          }}
        >
          {isEditing ? (
            <>
              <TextField
                label="รหัสวิชา"
                value={editFields.code}
                onChange={(e) => setEditFields((p) => ({ ...p, code: e.target.value }))}
                size="small"
              />
              <TextField
                label="ชื่อวิชา"
                value={editFields.name}
                onChange={(e) => setEditFields((p) => ({ ...p, name: e.target.value }))}
                size="small"
              />
              <TextField
                label="หน่วยกิต"
                type="number"
                value={editFields.credit}
                onChange={(e) => setEditFields((p) => ({ ...p, credit: Number(e.target.value) }))}
                size="small"
                inputProps={{ min: 0 }}
              />
              <FormControl size="small">
                <InputLabel>ภาษา</InputLabel>
                <Select
                  value={editFields.language || "thai"}
                  label="ภาษา"
                  onChange={(e) => setEditFields((p) => ({ ...p, language: e.target.value }))}
                >
                  {LANGUAGES.map((l) => (
                    <MenuItem key={l.value} value={l.value}>
                      {l.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                <InputLabel>ภาคการศึกษา</InputLabel>
                <Select
                  value={editFields.education_sectorId ?? "elective"}
                  label="ภาคการศึกษา"
                  onChange={(e) => {
                    const val = e.target.value;
                    const newSectorId = val === "elective" ? null : Number(val);
                    setEditFields((p) => ({ ...p, education_sectorId: newSectorId }));
                    // Auto-clear PRE prereqs that become invalid
                    setPreList((prev) =>
                      prev.filter((p) => {
                        const order = getSectorOrderById(
                          allSubjects.find((s) => s.id === p.requiresId)?.education_sectorId ?? null,
                          sectors,
                        );
                        return order < getSectorOrderById(newSectorId, sectors);
                      }),
                    );
                    // Auto-clear CO prereqs that become invalid (different sector)
                    setCoList((prev) =>
                      prev.filter((c) => {
                        const s = allSubjects.find((x) => x.id === c.requiresId);
                        return s?.education_sectorId === newSectorId && newSectorId !== null;
                      }),
                    );
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
            </>
          ) : (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary">รหัสวิชา</Typography>
                <Typography>{subject.code ?? "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">ชื่อวิชา</Typography>
                <Typography>{subject.name ?? "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">หน่วยกิต</Typography>
                <Typography>{subject.credit ?? "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">ภาษา</Typography>
                <Typography sx={{ textTransform: "capitalize" }}>
                  {subject.language === "thai"
                    ? "ไทย"
                    : subject.language === "eng"
                      ? "อังกฤษ"
                      : (subject.language ?? "-")}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                <Typography variant="caption" color="text.secondary">ภาคการศึกษา</Typography>
                <Typography>{sectorLabel(subject.education_sectorId, sectors)}</Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Prerequisites section — hidden for elective */}
        {!isElective && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              ความสัมพันธ์ของรายวิชา
            </Typography>

            {/* PRE section */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ต้องเรียนก่อน (PRE)
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                {preList.length === 0 && (
                  <Typography variant="body2" color="text.disabled">
                    ไม่มี
                  </Typography>
                )}
                {preList.map((p) => (
                  <Chip
                    key={p.requiresId}
                    label={`PRE: ${subjectName(p.requiresId)}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={
                      isEditing
                        ? () => setPreList((prev) => prev.filter((x) => x.requiresId !== p.requiresId))
                        : undefined
                    }
                  />
                ))}
              </Stack>
              {isEditing && validPRE.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel>เพิ่มวิชาที่ต้องเรียนก่อน</InputLabel>
                  <Select
                    value=""
                    label="เพิ่มวิชาที่ต้องเรียนก่อน"
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (!id) return;
                      setPreList((prev) => [...prev, { requiresId: id, type: "PRE" }]);
                    }}
                  >
                    {validPRE.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.code} {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* CO section */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                เรียนร่วมกัน (CO)
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                {coList.length === 0 && (
                  <Typography variant="body2" color="text.disabled">
                    ไม่มี
                  </Typography>
                )}
                {coList.map((c) => (
                  <Chip
                    key={c.requiresId}
                    label={`CO: ${subjectName(c.requiresId)}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    onDelete={
                      isEditing
                        ? () => handleRemoveCO(c)
                        : undefined
                    }
                  />
                ))}
              </Stack>
              {isEditing && validCO.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel>เพิ่มวิชาเรียนร่วมกัน</InputLabel>
                  <Select
                    value=""
                    label="เพิ่มวิชาเรียนร่วมกัน"
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (!id) return;
                      setCoList((prev) => [
                        ...prev,
                        { requiresId: id, sourceSubjectId: subject.id },
                      ]);
                    }}
                  >
                    {validCO.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.code} {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* Subjects that require this subject as PRE (read-only) */}
            {requiredByPRE.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  วิชาที่ต้องการวิชานี้ (read-only)
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {requiredByPRE.map((r) => (
                    <Chip
                      key={r.subjectId}
                      label={`PRE: ${subjectName(r.subjectId)}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}

        {isElective && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              วิชาเลือกไม่มีความสัมพันธ์ของรายวิชา
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubjectDetailDialog;
