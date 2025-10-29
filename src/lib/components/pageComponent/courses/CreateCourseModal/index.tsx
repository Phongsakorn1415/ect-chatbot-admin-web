"use client";

import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CourseYear } from "@/lib/types/course-year";
import { CourseFee } from "@/lib/types/course-fee";

type CreateCourseYearPayload = {
  year: number;
  normalFee?: number | null;
  summerFee?: number | null;
};

export type NewCourseModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (created: { courseYear: CourseYear; tuitionFee: CourseFee }) => void;
};

const NewCourseModal: React.FC<NewCourseModalProps> = ({ open, onClose, onCreated }) => {
  const [year, setYear] = React.useState<string>("");
  const [normalFee, setNormalFee] = React.useState<string>("");
  const [summerFee, setSummerFee] = React.useState<string>("");
  const [showFees, setShowFees] = React.useState<boolean>(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setYear("");
    setNormalFee("");
    setSummerFee("");
    setShowFees(false);
    setError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      onClose();
    }
  };

  const validate = () => {
    if (!year || year.trim() === "") {
      setError("กรุณากรอกปีของหลักสูตร");
      return false;
    }
    const y = Number(year);
    if (!Number.isInteger(y) || y < 2000 || y > 3000) {
      setError("ปีของหลักสูตรไม่ถูกต้อง (ควรเป็นตัวเลข พ.ศ./ค.ศ.)");
      return false;
    }
    setError(null);
    return true;
  };

  const toNumberOrNull = (v: string): number | null => {
    if (v === undefined || v === null) return null;
    const t = v.toString().trim();
    if (t === "") return null;
    const n = Number(t);
    return isNaN(n) ? null : n;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateCourseYearPayload = {
        year: Number(year),
        normalFee: toNumberOrNull(normalFee) ?? undefined,
        summerFee: toNumberOrNull(summerFee) ?? undefined,
      };

      const res = await fetch("/api/course/course-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "ไม่สามารถเพิ่มหลักสูตรได้");
      }

      const data = await res.json();
      const createdYear: CourseYear = data?.data?.newCourseYear;
      const createdFee: CourseFee = data?.data?.TuitionFee;

      if (onCreated && createdYear && createdFee) {
        onCreated({ courseYear: createdYear, tuitionFee: createdFee });
      }
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" sx={{borderRadius: '100%'}}>
      <DialogTitle>เพิ่มหลักสูตรปีใหม่</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            label="ปีของหลักสูตร"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            fullWidth
            inputProps={{ inputMode: "numeric", min: 1900 }}
          />
          <Accordion
            expanded={showFees}
            onChange={(_, expanded) => setShowFees(expanded)}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">กำหนดค่าเทอม (ไม่บังคับ)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField
                  label="ค่าเทอม (บาท)"
                  type="number"
                  value={normalFee}
                  onChange={(e) => setNormalFee(e.target.value)}
                  fullWidth
                  inputProps={{ inputMode: "numeric", min: 0 }}
                />
                <TextField
                  label="ค่าเทอมภาคฤดูร้อน (บาท)"
                  type="number"
                  value={summerFee}
                  onChange={(e) => setSummerFee(e.target.value)}
                  fullWidth
                  inputProps={{ inputMode: "numeric", min: 0 }}
                />
                <Box>
                  <Typography variant="caption" color="text.primary">
                    หมายเหตุ: หากไม่กรอกค่าเทอม จะถูกตั้งค่าเป็น 0 อัตโนมัติ และสามารถแก้ไขภายหลังได้
                  </Typography>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          ยกเลิก
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCourseModal;