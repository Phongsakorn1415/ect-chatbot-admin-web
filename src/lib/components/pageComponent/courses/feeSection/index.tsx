"use client";

import React from "react";
import { Button, Grid, TextField, Typography } from "@mui/material";
import type { CourseFee } from "@/lib/types/course-fee";
import CustomAlert from "@/lib/components/customAlert";

type Props = {
	courseYearId: number | null;
	courseFee: CourseFee | null;
	onUpdated?: (fee: CourseFee) => void;
};

const FeeSection: React.FC<Props> = ({ courseYearId, courseFee, onUpdated }) => {
	const [isEditMode, setIsEditMode] = React.useState(false);
	const [normalFee, setNormalFee] = React.useState<number>(0);
	const [summerFee, setSummerFee] = React.useState<number>(0);

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

	// Sync local state when parent data changes
	React.useEffect(() => {
		if (courseFee) {
			setNormalFee(courseFee.normal ?? 0);
			setSummerFee(courseFee.summer ?? 0);
		} else {
			setNormalFee(0);
			setSummerFee(0);
		}
		setIsEditMode(false);
	}, [courseFee, courseYearId]);

		const handleSave = async () => {
			if (courseYearId == null) {
				showAlert("กรุณาเลือกหลักสูตรก่อนบันทึก", "warning");
				return;
			}
		try {
			const response = await fetch(`/api/course/course-fee/${courseYearId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ normal: normalFee, summer: summerFee }),
			});
				if (!response.ok) throw new Error(`Save failed: ${response.status}`);
			const data = await response.json();
			const updated: CourseFee = data?.data;
			onUpdated?.(updated);
			setIsEditMode(false);
				showAlert("บันทึกค่าเทอมสำเร็จ", "success");
		} catch (err) {
				console.error(err);
				showAlert("บันทึกค่าเทอมไม่สำเร็จ กรุณาลองอีกครั้ง", "error");
		}
	};

	return (
		<>
				{alertOpen && (
					<CustomAlert message={alertMessage} severity={alertSeverity} />
				)}
			<Grid container spacing={2} sx={{ mt: 1 }}>
				<Grid size={6}>
					<Typography sx={{ mt: 2, mb: 1, fontSize: "175%", textAlign: "left" }}>
						ค่าเทอม
					</Typography>
				</Grid>
				<Grid size={6} sx={{ display: "flex", justifyContent: "end", alignItems: "center" }}>
					{isEditMode ? (
						<>
							<Button
								variant="contained"
								color="error"
								sx={{ mr: 2 }}
								onClick={() => {
									setIsEditMode(false);
									// reset values from props
									setNormalFee(courseFee ? courseFee.normal : 0);
									setSummerFee(courseFee ? courseFee.summer : 0);
								}}
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
			<Grid container spacing={2} sx={{ mt: 1 }}>
				<Grid size={{ xs: 12, md: 6 }}>
					<TextField
						id="normalFee"
						label="ค่าเทอม (บาท)"
						value={normalFee ?? 0}
						onChange={(e) => setNormalFee(Number(e.target.value))}
						fullWidth
						disabled={!isEditMode}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<TextField
						id="summerFee"
						label="ค่าเทอม ภาคฤดูร้อน (บาท)"
						value={summerFee ?? 0}
						onChange={(e) => setSummerFee(Number(e.target.value))}
						fullWidth
						disabled={!isEditMode}
					/>
				</Grid>
			</Grid>
		</>
	);
};

export default FeeSection;

