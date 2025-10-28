"use client";

import React, { useMemo, useState } from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
	Checkbox,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import type { educationSector } from "@/lib/types/course-year";

type AddContext =
	| { type: "sector"; sector: educationSector }
	| { type: "elective"; courseYearId: number | null };

type Props = {
	open: boolean;
	onClose: () => void;
	context: AddContext;
	sectors?: educationSector[];
	courseYearId?: number | null;
	courseYearYear?: number | null;
	onAdded?: (createdCount?: number) => void;
};

type ManualRow = {
	code: string;
	name: string;
	credit: string; // keep as string for input; cast to number on submit
	language: string;
	selected?: boolean;
};

type ParsedSubject = {
	code?: string;
	name?: string;
	credit?: number;
	language?: string;
};

const defaultManualRow = (): ManualRow => ({ code: "", name: "", credit: "", language: "", selected: true });

const AddSubjectModal: React.FC<Props> = ({ open, onClose, context, sectors = [], courseYearId = null, courseYearYear = null, onAdded }) => {
	const [tab, setTab] = useState<0 | 1>(0); // 0: manual, 1: AI

	// Manual state
	const [rows, setRows] = useState<ManualRow[]>([defaultManualRow()]);
	const [saving, setSaving] = useState(false);

	// AI state
	const [files, setFiles] = useState<File[]>([]);
	const [aiLoading, setAiLoading] = useState(false);
	const [parsed, setParsed] = useState<ParsedSubject[]>([]);
	const [destinations, setDestinations] = useState<Record<number, string>>({}); // key=index, value=destKey
	const destTabs = useMemo(() => {
		// Build destination tabs from sectors + elective
		const sectorTabs = (sectors ?? []).map((s) => ({ key: `sector:${s.id}`, label: `ปี ${s.year} ${s.semester !== 0 ? `ภาค ${s.semester}` : "ภาคฤดูร้อน"}` }));
		const electiveTab = { key: "elective", label: "วิชาเลือก" };
		return [...sectorTabs, electiveTab];
	}, [sectors]);
	const [activeDestTab, setActiveDestTab] = useState(0);

	const resetAll = () => {
		setTab(0);
		setRows([defaultManualRow()]);
		setSaving(false);
		setFiles([]);
		setAiLoading(false);
		setParsed([]);
		setDestinations({});
		setActiveDestTab(0);
	};

	const handleClose = () => {
		if (saving || aiLoading) return;
		resetAll();
		onClose();
	};

	// Helpers for POST payload
	const buildPayload = (base: { code?: string; name?: string; credit?: number; language?: string }) => {
		if (context.type === "sector") {
			return {
				...base,
				isRequire: true,
				education_sectorId: context.sector.id,
			};
		}
		// elective
		return {
			...base,
			isRequire: false,
			course_yearId: courseYearId,
		};
	};

	// Manual submit
	const onSubmitManual = async () => {
		// Basic validation
		const toCreate = rows
			.filter((r) => r.selected !== false)
			.map((r) => ({
				code: r.code?.trim() || undefined,
				name: r.name?.trim() || "",
				credit: r.credit !== "" ? Number(r.credit) : undefined,
				language: r.language?.trim() || undefined,
			}))
			.filter((r) => r.name.length > 0);

		if (toCreate.length === 0) return;
		if (context.type === "elective" && (courseYearId == null || Number.isNaN(Number(courseYearId)))) {
			alert("ไม่พบปีหลักสูตรสำหรับวิชาเลือก");
			return;
		}

		try {
			setSaving(true);
			let created = 0;
			for (const r of toCreate) {
				const payload = buildPayload(r);
				const res = await fetch("/api/course/subject", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				if (!res.ok) {
					const text = await res.text();
					console.error("Create subject failed:", text);
					throw new Error(text || "Create subject failed");
				}
				created += 1;
			}
			onAdded?.(created);
			resetAll();
			onClose();
		} catch (e) {
			console.error(e);
			alert("เกิดข้อผิดพลาดในการบันทึกวิชา");
		} finally {
			setSaving(false);
		}
	};

	// AI upload/parse
	const onFilesChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		const fl = e.target.files ? Array.from(e.target.files) : [];
		setFiles(fl);
	};

	const analyzeWithAI = async () => {
		if (files.length === 0) return;
		setAiLoading(true);
		try {
			const form = new FormData();
			files.forEach((f) => form.append("files", f));
			const res = await fetch("/api/ai/subjects/parse", { method: "POST", body: form });
			if (!res.ok) {
				// Fallback: create a small mock from filenames for demo
				const mock: ParsedSubject[] = files.slice(0, 3).map((f, i) => ({
					code: `SUB${i + 1}`,
					name: f.name.replace(/\.[^.]+$/, ""),
					credit: 3,
					language: "ไทย",
				}));
				setParsed(mock);
				const initialDest: Record<number, string> = {};
				mock.forEach((_, idx) => {
					initialDest[idx] = context.type === "sector" ? `sector:${context.sector.id}` : "elective";
				});
				setDestinations(initialDest);
				return;
			}
			const data = await res.json();
			const list: ParsedSubject[] = Array.isArray(data?.data) ? data.data : [];
			setParsed(list);
			const initialDest: Record<number, string> = {};
			list.forEach((_, idx) => {
				initialDest[idx] = context.type === "sector" ? `sector:${context.sector.id}` : "elective";
			});
			setDestinations(initialDest);
		} catch (e) {
			console.error(e);
			alert("ไม่สามารถวิเคราะห์ไฟล์ได้");
		} finally {
			setAiLoading(false);
		}
	};

	const onSubmitAI = async () => {
		if (parsed.length === 0) return;
		if (context.type === "elective" && (courseYearId == null || Number.isNaN(Number(courseYearId)))) {
			alert("ไม่พบปีหลักสูตรสำหรับวิชาเลือก");
			return;
		}
		try {
			setSaving(true);
			let created = 0;
			for (let i = 0; i < parsed.length; i++) {
				const subj = parsed[i];
				const dest = destinations[i] || (context.type === "sector" ? `sector:${context.sector.id}` : "elective");
				let payloadBase = {
					code: subj.code,
					name: subj.name ?? "",
					credit: subj.credit,
					language: subj.language,
				} as { code?: string; name?: string; credit?: number; language?: string };
				let payload: any;
				if (dest === "elective") {
					payload = { ...payloadBase, isRequire: false, course_yearId: courseYearId };
				} else if (dest.startsWith("sector:")) {
					const sectorId = Number(dest.split(":")[1]);
					payload = { ...payloadBase, isRequire: true, education_sectorId: sectorId };
				} else {
					// default fallback
					payload = buildPayload(payloadBase);
				}

				// Guard name
				if (!payload.name || String(payload.name).trim() === "") continue;

				const res = await fetch("/api/course/subject", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				if (!res.ok) {
					const txt = await res.text();
					console.error("Create subject failed:", txt);
					throw new Error(txt || "Create subject failed");
				}
				created += 1;
			}
			onAdded?.(created);
			resetAll();
			onClose();
		} catch (e) {
			console.error(e);
			alert("เกิดข้อผิดพลาดในการบันทึกวิชา");
		} finally {
			setSaving(false);
		}
	};

	const activeDestKey = destTabs[activeDestTab]?.key ?? "";

	return (
		<Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
			<DialogTitle>เพิ่มวิชา</DialogTitle>
			<DialogContent dividers>
				<Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
					<Tab label="เพิ่มวิชา" />
					<Tab label="เพิ่มด้วย AI" />
				</Tabs>

				{tab === 0 && (
					<Box>
						<Typography sx={{ mb: 1, color: "text.primary" }}>
							{context.type === "sector"
								? `ภาคการศึกษา: ปี ${context.sector.year} ${context.sector.semester !== 0 ? `ภาค ${context.sector.semester}` : "ภาคฤดูร้อน"} (วิชาบังคับ)`
								: `วิชาเลือกของปีหลักสูตร (ปี: ${courseYearYear ?? "-"})`}
						</Typography>
						<Stack spacing={2}>
							{rows.map((r, idx) => (
								<Box key={idx} sx={{ border: "1px solid #eee", borderRadius: 1, p: 2 }}>
									<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
										<Checkbox
											checked={r.selected !== false}
											onChange={(e) => {
												const val = e.target.checked;
												setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, selected: val } : x)));
											}}
										/>
										<TextField
                                            required
											label="รหัสวิชา"
											value={r.code}
											onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, code: e.target.value } : x)))}
											sx={{ minWidth: 140 }}
										/>
										<TextField
											required
											label="ชื่อวิชา"
											value={r.name}
											onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
											sx={{ minWidth: 160, flexGrow: 1 }}
										/>
										<TextField
											label="หน่วยกิต"
											type="number"
											value={r.credit}
											onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, credit: e.target.value } : x)))}
											sx={{ minWidth: 30 }}
											inputProps={{ min: 0 }}
										/>
										<TextField
											label="ภาษา"
											value={r.language}
											onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, language: e.target.value } : x)))}
											sx={{ minWidth: 50 }}
										/>
										<IconButton color="error" aria-label="remove" onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}>
											<DeleteIcon />
										</IconButton>
									</Stack>
								</Box>
							))}
							<Button startIcon={<AddIcon />} onClick={() => setRows((prev) => [...prev, defaultManualRow()])}>
								เพิ่มแถว
							</Button>
						</Stack>
					</Box>
				)}

				{tab === 1 && (
					<Box>
						<Stack spacing={2}>
							<Box>
								<input type="file" accept="application/pdf,image/*" multiple onChange={onFilesChange} />
								{files.length > 0 && (
									<Typography sx={{ mt: 1 }} variant="body2" color="text.secondary">
										ไฟล์ที่เลือก: {files.map((f) => f.name).join(", ")}
									</Typography>
								)}
								<Box sx={{ mt: 1 }}>
									<Button variant="outlined" onClick={analyzeWithAI} disabled={files.length === 0 || aiLoading}>
										{aiLoading ? "กำลังวิเคราะห์..." : "วิเคราะห์ด้วย AI"}
									</Button>
								</Box>
							</Box>

							{parsed.length > 0 && (
								<Box>
									<Typography sx={{ mb: 1 }}>
										เลือกปลายทางภาคการศึกษาให้แต่ละวิชา (แท็บเพื่อกรองรายการ)
									</Typography>
									<Tabs
										value={activeDestTab}
										onChange={(_, v) => setActiveDestTab(v)}
										variant="scrollable"
										scrollButtons="auto"
										sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
									>
										{destTabs.map((t, i) => (
											<Tab key={t.key} label={t.label} />
										))}
									</Tabs>

									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>รหัสวิชา</TableCell>
													<TableCell>ชื่อวิชา</TableCell>
													<TableCell>หน่วยกิต</TableCell>
													<TableCell>ภาษา</TableCell>
													<TableCell>ปลายทาง</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{parsed.map((p, idx) => {
													const dest = destinations[idx] ?? (context.type === "sector" ? `sector:${context.sector.id}` : "elective");
													const show = dest === activeDestKey || (activeDestKey === undefined && true) || (!activeDestKey && true) || destTabs[activeDestTab]?.key === dest;
													// Only show rows that match active tab
													if (destTabs[activeDestTab]?.key !== dest) return null;
													return (
														<TableRow key={idx}>
															<TableCell sx={{ minWidth: 120 }}>{p.code ?? "-"}</TableCell>
															<TableCell sx={{ minWidth: 240 }}>{p.name ?? "-"}</TableCell>
															<TableCell sx={{ minWidth: 80 }}>{p.credit ?? "-"}</TableCell>
															<TableCell sx={{ minWidth: 120 }}>{p.language ?? "-"}</TableCell>
															<TableCell sx={{ minWidth: 200 }}>
																<FormControl fullWidth size="small">
																	<InputLabel id={`dest-${idx}`}>ปลายทาง</InputLabel>
																	<Select
																		labelId={`dest-${idx}`}
																		value={dest}
																		label="ปลายทาง"
																		onChange={(e) => setDestinations((prev) => ({ ...prev, [idx]: String(e.target.value) }))}
																	>
																		{sectors.map((s) => (
																			<MenuItem key={s.id} value={`sector:${s.id}`}>
																				ปี {s.year} {s.semester !== 0 ? `ภาค ${s.semester}` : "ภาคฤดูร้อน"}
																			</MenuItem>
																		))}
																		<MenuItem value="elective">วิชาเลือก</MenuItem>
																	</Select>
																</FormControl>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</TableContainer>
								</Box>
							)}
						</Stack>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={saving || aiLoading}>ยกเลิก</Button>
				{tab === 0 ? (
					<Button variant="contained" onClick={onSubmitManual} disabled={saving}>
						บันทึก
					</Button>
				) : (
					<Button variant="contained" onClick={onSubmitAI} disabled={saving || parsed.length === 0}>
						เพิ่มจาก AI
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default AddSubjectModal;

