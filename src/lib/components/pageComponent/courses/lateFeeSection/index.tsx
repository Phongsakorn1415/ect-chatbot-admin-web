"use client";

import React from "react";
import { Button, Grid, TextField, Typography, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import CustomAlert from "@/lib/components/customAlert";
import { LateFee, FeeUnit } from "@/lib/types/late-fee";

const LateFeeSection: React.FC = () => {
    const [isEditMode, setIsEditMode] = React.useState(false);

    // State for the fields
    const [rate, setRate] = React.useState<number>(0);
    const [unit, setUnit] = React.useState<FeeUnit>(FeeUnit.DAY);
    const [maxAmount, setMaxAmount] = React.useState<number>(0);

    // Keep track of initial values to revert on cancel
    const [initialValues, setInitialValues] = React.useState<{ rate: number, unit: FeeUnit, maxAmount: number }>({
        rate: 0,
        unit: FeeUnit.DAY,
        maxAmount: 0
    });

    // Alert state
    const [alertOpen, setAlertOpen] = React.useState(false);
    const [alertMessage, setAlertMessage] = React.useState("");
    const [alertSeverity, setAlertSeverity] = React.useState<"error" | "warning" | "info" | "success">("info");
    const alertTimer = React.useRef<number | null>(null);

    const showAlert = (message: string, severity: "error" | "warning" | "info" | "success" = "info", durationMs = 3000) => {
        if (alertTimer.current) {
            window.clearTimeout(alertTimer.current);
        }
        setAlertMessage(message);
        setAlertSeverity(severity);
        setAlertOpen(true);
        alertTimer.current = window.setTimeout(() => {
            setAlertOpen(false);
            alertTimer.current = null;
        }, durationMs);
    };

    React.useEffect(() => {
        return () => {
            if (alertTimer.current) {
                window.clearTimeout(alertTimer.current);
            }
        };
    }, []);

    // Fetch data on mount
    React.useEffect(() => {
        const fetchLateFee = async () => {
            try {
                const response = await fetch('/api/course/late-fee');
                if (response.ok) {
                    const data = await response.json();
                    const fee: LateFee = data?.data || { rate: 0, unit: FeeUnit.DAY, max_amount: 0 };

                    setRate(fee.rate);
                    setUnit(fee.unit as FeeUnit);
                    setMaxAmount(fee.max_amount);

                    setInitialValues({
                        rate: fee.rate,
                        unit: fee.unit as FeeUnit,
                        maxAmount: fee.max_amount
                    });
                }
            } catch (error) {
                console.error('Failed to fetch late fee:', error);
            }
        };
        fetchLateFee();
    }, []);

    const handleSave = async () => {
        const confirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการบันทึกการแก้ไข?");
        if (!confirm) return;
        try {
            const response = await fetch(`/api/course/late-fee`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rate, unit, max_amount: maxAmount }),
            });
            if (!response.ok) throw new Error(`Save failed: ${response.status}`);
            const data = await response.json();
            const updated: LateFee = data?.data;

            setRate(updated.rate);
            setUnit(updated.unit);
            setMaxAmount(updated.max_amount);

            setInitialValues({
                rate: updated.rate,
                unit: updated.unit,
                maxAmount: updated.max_amount
            });

            setIsEditMode(false);
            showAlert("บันทึกค่าปรับสำเร็จ", "success");
        } catch (err) {
            console.error(err);
            showAlert("บันทึกค่าปรับไม่สำเร็จ กรุณาลองอีกครั้ง", "error");
        }
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setRate(initialValues.rate);
        setUnit(initialValues.unit);
        setMaxAmount(initialValues.maxAmount);
    }

    const unitLabel: Record<FeeUnit, string> = {
        [FeeUnit.DAY]: 'วัน',
        [FeeUnit.WEEK]: 'สัปดาห์',
        [FeeUnit.MONTH]: 'เดือน'
    };

    return (
        <>
            {alertOpen && (
                <CustomAlert message={alertMessage} severity={alertSeverity} />
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={6}>
                    <Typography sx={{ mt: 2, mb: 1, fontSize: "175%", textAlign: "left" }}>
                        ค่าปรับลงทะเบียนช้า
                    </Typography>
                </Grid>
                <Grid size={6} sx={{ display: "flex", justifyContent: "end", alignItems: "center" }}>
                    {isEditMode ? (
                        <>
                            <Button
                                variant="contained"
                                color="error"
                                sx={{ mr: 2 }}
                                onClick={handleCancel}
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleSave}
                            >
                                บันทึก
                            </Button>
                        </>
                    ) : (
                        <Button variant="contained" color="warning" onClick={() => setIsEditMode(true)}>
                            แก้ไข
                        </Button>
                    )}
                </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1, mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        id="lateFeeRate"
                        label="ค่าปรับ (บาท)"
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        fullWidth
                        type="number"
                        disabled={!isEditMode}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth disabled={!isEditMode}>
                        <InputLabel id="unit-select-label">ต่อระยะเวลา</InputLabel>
                        <Select
                            labelId="unit-select-label"
                            id="unit-select"
                            value={unit}
                            label="ต่อระยะเวลา"
                            onChange={(e) => setUnit(e.target.value as FeeUnit)}
                        >
                            <MenuItem value={FeeUnit.DAY}>{unitLabel[FeeUnit.DAY]}</MenuItem>
                            <MenuItem value={FeeUnit.WEEK}>{unitLabel[FeeUnit.WEEK]}</MenuItem>
                            <MenuItem value={FeeUnit.MONTH}>{unitLabel[FeeUnit.MONTH]}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        id="maxAmount"
                        label="จำนวนค่าปรับสูงสุด (บาท)"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(Number(e.target.value))}
                        fullWidth
                        type="number"
                        disabled={!isEditMode}
                        helperText="ใส่ 0 หากไม่จำกัด"
                    />
                </Grid>
            </Grid>
        </>
    );
};

export default LateFeeSection;
