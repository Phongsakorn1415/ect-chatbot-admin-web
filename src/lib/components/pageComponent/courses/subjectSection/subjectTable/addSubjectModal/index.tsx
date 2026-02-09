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
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { PDFDocument } from 'pdf-lib';
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
	selected?: boolean;
	year?: number;
	term?: number;
}; // ParsedSubject

const defaultManualRow = (): ManualRow => ({ code: "", name: "", credit: "", language: "", selected: true });

const AddSubjectModal: React.FC<Props> = ({ open, onClose, context, sectors = [], courseYearId = null, courseYearYear = null, onAdded }) => {
	const [tab, setTab] = useState<0 | 1>(0); // 0: manual, 1: AI

	// Manual state
	const [rows, setRows] = useState<ManualRow[]>([defaultManualRow()]);
	const [saving, setSaving] = useState(false);

	// AI state
	const [files, setFiles] = useState<File[]>([]);
	const [pageRanges, setPageRanges] = useState<Record<string, string>>({});
	const [aiLoading, setAiLoading] = useState(false);
	const [parsed, setParsed] = useState<ParsedSubject[]>([]);
	const [destinations, setDestinations] = useState<Record<number, string>>({}); // key=index, value=destKey
	const [missingSectorAlert, setMissingSectorAlert] = useState<{ year: number; term: number } | null>(null);
	const [tempSectors, setTempSectors] = useState<educationSector[]>([]);
	const [sortConfig, setSortConfig] = useState<{ key: keyof ParsedSubject; direction: 'asc' | 'desc' }>({ key: 'year', direction: 'asc' });
	const [creatingSector, setCreatingSector] = useState(false);

	// Combined sectors for validation
	const allSectors = useMemo(() => [...sectors, ...tempSectors], [sectors, tempSectors]);
	const parsePageRange = (rangeStr: string): number[] => {
		const pages: Set<number> = new Set();
		const parts = rangeStr.split(",").map(s => s.trim()).filter(s => s);
		for (const part of parts) {
			if (part.includes("-")) {
				const [start, end] = part.split("-").map(Number);
				if (!isNaN(start) && !isNaN(end)) {
					for (let i = start; i <= end; i++) pages.add(i - 1);
				}
			} else {
				const p = Number(part);
				if (!isNaN(p)) pages.add(p - 1);
			}
		}
		return Array.from(pages).sort((a, b) => a - b);
	};

	const resetAll = () => {
		setTab(0);
		setRows([defaultManualRow()]);
		setSaving(false);
		setFiles([]);
		setPageRanges({});
		setAiLoading(false);
		setParsed([]);
		setDestinations({});
		setMissingSectorAlert(null);
		setTempSectors([]);
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
			let createdSubjectIDs = [];

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

				const subjectID = await res.json();
				createdSubjectIDs.push(subjectID.data.id);

				created += 1;
			}

			console.log("createdSubjectIDs", createdSubjectIDs);
			const embedres = await fetch("/api/embed",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subject_id: createdSubjectIDs }),
				});

			console.log("embedres", embedres);

			if (!embedres.ok) {
				const text = await embedres.text();
				console.error("Embed failed:", text);
				throw new Error(text || "Embed failed");
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
		setMissingSectorAlert(null);
		try {
			let allParsedData: ParsedSubject[] = [];

			for (const file of files) {
				let body: FormData | string;
				let headers: Record<string, string> = {};
				let endpoint = "";

				if (file.type === "application/pdf") {
					endpoint = "/api/ai/subjects/gemini/pdf";
					const rangeStr = pageRanges[file.name];
					let fileToUpload = file;

					if (rangeStr) {
						try {
							const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
							const newPdf = await PDFDocument.create();
							const indices = parsePageRange(rangeStr);
							// Filter indices to be within bounds
							const validIndices = indices.filter(i => i >= 0 && i < pdfDoc.getPageCount());

							if (validIndices.length > 0) {
								const copiedPages = await newPdf.copyPages(pdfDoc, validIndices);
								copiedPages.forEach((page: any) => newPdf.addPage(page));
								const pdfBytes = await newPdf.save();
								fileToUpload = new File([pdfBytes as any], file.name, { type: "application/pdf" });
							}
						} catch (e) {
							console.error("Error slicing PDF:", e);
							// Fallback to original file or show warning?
							// For now, continue with original file if slicing fails, or maybe strict error?
						}
					}

					const form = new FormData();
					form.append("file", fileToUpload);
					body = form;
				} else if (file.type.startsWith("image/")) {
					endpoint = "/api/ai/subjects/gemini/img";
					const form = new FormData();
					form.append("file", file);
					body = form;
				} else {
					console.warn(`Unsupported file type: ${file.type}`);
					continue;
				}

				const res = await fetch(endpoint, { method: "POST", body });
				if (!res.ok) {
					console.error(`Failed to process ${file.name}`);
					continue;
				}

				const responseData = await res.json();
				const parsedFromFile: ParsedSubject[] = Array.isArray(responseData) ? responseData : [];
				const mappedData: ParsedSubject[] = parsedFromFile.map(item => ({
					code: item.code,
					name: item.name,
					credit: item.credit,
					language: item.language === 'th' ? 'ไทย' : item.language === 'en' ? 'อังกฤษ' : item.language,
					selected: true,
					year: item.year, // AI returns 'year'
					term: item.term  // AI returns 'term'
				}));
				allParsedData = [...allParsedData, ...mappedData];
			}

			if (allParsedData.length === 0) {
				alert("ไม่พบข้อมูลวิชาในไฟล์ที่อัปโหลด");
				setParsed([]);
				return;
			}

			// Validation Logic: Check for missing sectors
			checkNextMissing(allParsedData, allSectors);

		} catch (e) {
			console.error(e);
			alert("ไม่สามารถวิเคราะห์ไฟล์ได้");
		} finally {
			setAiLoading(false);
		}
	};

	const checkNextMissing = (data: ParsedSubject[], currentSectors: educationSector[]) => {
		const missing = data.find(p => {
			if (!p.year || p.term === undefined) return false;
			return !currentSectors.some(s => s.year === p.year && s.semester === p.term);
		});

		if (missing) {
			setParsed(data);
			setMissingSectorAlert({ year: missing.year!, term: missing.term! });
		} else {
			setParsed(data);
			setMissingSectorAlert(null);
			// Auto-map destinations
			const initialDest: Record<number, string> = {};
			data.forEach((p, idx) => {
				const match = currentSectors.find(s => s.year === p.year && s.semester === p.term);
				if (match) {
					initialDest[idx] = `sector:${match.id}`;
				} else {
					initialDest[idx] = "elective";
				}
			});
			setDestinations(initialDest);
		}
	};

	const handleCreateSector = async () => {
		if (!missingSectorAlert || !courseYearId) return;
		try {
			setCreatingSector(true);
			const res = await fetch(`/api/course/course-year/${courseYearId}/sector`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ year: missingSectorAlert.year, semester: missingSectorAlert.term }),
			});
			if (!res.ok) throw new Error("Failed to create sector");

			const json = await res.json();
			const newSector = json.data;

			const newTempSectors = [...tempSectors, newSector];
			setTempSectors(newTempSectors);

			// Re-check with new sectors
			checkNextMissing(parsed, [...sectors, ...newTempSectors]); // Use explicit list to be safe
		} catch (e) {
			console.error(e);
			alert("เกิดข้อผิดพลาดในการสร้างภาคการศึกษา");
		} finally {
			setCreatingSector(false);
		}
	};

	const handleDeleteMissing = () => {
		if (!missingSectorAlert) return;
		const filtered = parsed.filter(p => !(p.year === missingSectorAlert.year && p.term === missingSectorAlert.term));
		if (filtered.length === 0) {
			alert("ไม่มีวิชาเหลืออยู่");
			resetAll();
			return;
		}
		checkNextMissing(filtered, allSectors);
	};

	const handleCancelAnalysis = () => {
		setParsed([]);
		setMissingSectorAlert(null);
		setTempSectors([]);
	};

	const handleSort = (key: keyof ParsedSubject) => {
		setSortConfig(prev => ({
			key,
			direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const sortedParsed = useMemo(() => {
		const sorted = [...parsed];
		sorted.sort((a, b) => {
			const aVal = a[sortConfig.key] ?? "";
			const bVal = b[sortConfig.key] ?? "";
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
		return sorted;
	}, [parsed, sortConfig]);

	const onSubmitAI = async () => {
		if (parsed.length === 0) return;

		// Filter only selected subjects
		const selectedSubjects = parsed.filter(subj => subj.selected !== false);
		if (selectedSubjects.length === 0) {
			alert("กรุณาเลือกวิชาที่ต้องการเพิ่ม");
			return;
		}

		if (context.type === "elective" && (courseYearId == null || Number.isNaN(Number(courseYearId)))) {
			alert("ไม่พบปีหลักสูตรสำหรับวิชาเลือก");
			return;
		}
		try {
			setSaving(true);
			let created = 0;
			let createdSubjectIDs: number[] = [];

			for (let i = 0; i < parsed.length; i++) {
				const subj = parsed[i];

				// Skip unselected subjects
				if (subj.selected === false) continue;

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

				const subjectID = await res.json();
				createdSubjectIDs.push(subjectID.data.id);

				created += 1;
			}

			const embedres = await fetch("/api/embed",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subject_id: createdSubjectIDs }),
				});

			if (!embedres.ok) {
				const text = await embedres.text();
				console.error("Embed failed:", text);
				throw new Error(text || "Embed failed");
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

	// const activeDestKey = destTabs[activeDestTab]?.key ?? "";

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
								<TextField
									type="file"
									variant="outlined"
									fullWidth
									label="เลือกไฟล์ (PDF, รูปภาพ)"
									InputLabelProps={{
										shrink: true,
									}}
									inputProps={{
										multiple: true,
										accept: "application/pdf,image/*"
									}}
									onChange={onFilesChange}
									sx={{
										mb: 2,
										'& input[type="file"]': {
											'&::file-selector-button': {
												backgroundColor: '#1976d2',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												padding: '8px 16px',
												marginRight: '12px',
												fontSize: '14px',
												fontWeight: '500',
												cursor: 'pointer',
												transition: 'all 0.2s ease-in-out',
												'&:hover': {
													backgroundColor: '#1565c0',
													transform: 'translateY(-1px)',
													boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
												},
												'&:active': {
													transform: 'translateY(0)',
													boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
												}
											}
										}
									}}
								/>
								{files.length > 0 && (
									<Stack spacing={1} sx={{ mt: 1 }}>
										{files.map((f, idx) => (
											<Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<Typography variant="body2" sx={{ flexGrow: 1 }}>
													{f.name} ({Math.round(f.size / 1024)} KB)
												</Typography>
												{f.type === "application/pdf" && (
													<TextField
														label="ระบุหน้า (เช่น 1-3, 5)"
														size="small"
														placeholder="ทั้งหมด"
														value={pageRanges[f.name] || ""}
														onChange={(e) => setPageRanges(prev => ({ ...prev, [f.name]: e.target.value }))}
														sx={{ width: 150 }}
													/>
												)}
												<IconButton
													size="small"
													onClick={() => {
														const newFiles = files.filter((_, i) => i !== idx);
														setFiles(newFiles);
														const newRanges = { ...pageRanges };
														delete newRanges[f.name];
														setPageRanges(newRanges);
													}}
												>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Box>
										))}
									</Stack>
								)}
								<Box sx={{ mt: 1 }}>
									<Button variant="outlined" onClick={analyzeWithAI} disabled={files.length === 0 || aiLoading}>
										{aiLoading ? "กำลังวิเคราะห์..." : "วิเคราะห์ด้วย AI"}
									</Button>
								</Box>
							</Box>

							<Box>
								<Typography sx={{ mb: 1 }}>
									ตรวจสอบและแก้ไขข้อมูลวิชาก่อนบันทึก
								</Typography>

								<TableContainer sx={{ maxHeight: 400, border: "1px solid #eee" }}>
									<Table stickyHeader size="small">
										<TableHead>
											<TableRow>
												<TableCell padding="checkbox">
													<Checkbox
														checked={parsed.every(p => p.selected !== false)}
														indeterminate={parsed.some(p => p.selected !== false) && !parsed.every(p => p.selected !== false)}
														onChange={(e) => {
															const val = e.target.checked;
															setParsed(prev => prev.map(p => ({ ...p, selected: val })));
														}}
													/>
												</TableCell>
												<TableCell sx={{ minWidth: 100 }}>
													<Button variant="text" size="small" onClick={() => handleSort('code')}>
														รหัสวิชา {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
													</Button>
												</TableCell>
												<TableCell sx={{ minWidth: 150 }}>
													<Button variant="text" size="small" onClick={() => handleSort('name')}>
														ชื่อวิชา {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
													</Button>
												</TableCell>
												<TableCell>หน่วยกิต</TableCell>
												<TableCell>ภาษา</TableCell>
												<TableCell>
													<Button variant="text" size="small" onClick={() => handleSort('year')}>
														ปี {sortConfig.key === 'year' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
													</Button>
												</TableCell>
												<TableCell>
													<Button variant="text" size="small" onClick={() => handleSort('term')}>
														เทอม {sortConfig.key === 'term' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
													</Button>
												</TableCell>
												<TableCell>เพิ่มไปยัง</TableCell>
												<TableCell>Action</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{sortedParsed.map((p, idx) => {
												// Find original index to update destinations
												const originalIdx = parsed.indexOf(p);
												const dest = destinations[originalIdx] ?? "elective";

												return (
													<TableRow key={idx} hover>
														<TableCell padding="checkbox">
															<Checkbox
																checked={p.selected !== false}
																onChange={(e) => {
																	const val = e.target.checked;
																	setParsed(prev => prev.map((x, i) => i === originalIdx ? { ...x, selected: val } : x));
																}}
															/>
														</TableCell>
														<TableCell>
															<TextField
																variant="standard"
																value={p.code || ""}
																onChange={(e) => setParsed(prev => prev.map((x, i) => i === originalIdx ? { ...x, code: e.target.value } : x))}
																fullWidth
															/>
														</TableCell>
														<TableCell>
															<TextField
																variant="standard"
																value={p.name || ""}
																onChange={(e) => setParsed(prev => prev.map((x, i) => i === originalIdx ? { ...x, name: e.target.value } : x))}
																fullWidth
															/>
														</TableCell>
														<TableCell>
															<TextField
																variant="standard"
																type="number"
																value={p.credit || ""}
																onChange={(e) => setParsed(prev => prev.map((x, i) => i === originalIdx ? { ...x, credit: Number(e.target.value) || 0 } : x))}
																sx={{ width: 50 }}
																inputProps={{ min: 0 }}
															/>
														</TableCell>
														<TableCell>
															<TextField
																variant="standard"
																value={p.language || ""}
																onChange={(e) => setParsed(prev => prev.map((x, i) => i === originalIdx ? { ...x, language: e.target.value } : x))}
																sx={{ width: 50 }}
															/>
														</TableCell>
														<TableCell>{p.year}</TableCell>
														<TableCell>{p.term}</TableCell>
														<TableCell>
															<FormControl variant="standard" size="small" fullWidth>
																<Select
																	value={dest}
																	onChange={(e) => setDestinations(prev => ({ ...prev, [originalIdx]: String(e.target.value) }))}
																>
																	{allSectors.map((s) => (
																		<MenuItem key={s.id} value={`sector:${s.id}`}>
																			ปี {s.year} {s.semester !== 0 ? `ภาค ${s.semester}` : "ภาคฤดูร้อน"}
																		</MenuItem>
																	))}
																	<MenuItem value="elective">วิชาเลือก</MenuItem>
																</Select>
															</FormControl>
														</TableCell>
														<TableCell>
															<IconButton
																size="small"
																color="error"
																onClick={() => {
																	setParsed(prev => prev.filter((_, i) => i !== originalIdx));
																	setDestinations(prev => {
																		const newDest = { ...prev };
																		delete newDest[originalIdx];
																		// Reindex? Actually filtered logic above uses original references, but parsed is recreated.
																		// With current logic, purely filtering index is dangerous if we rely on it.
																		// Better to reset parsed and destinations completely if we delete?
																		// Or just filter and rebuild dests.
																		// Simple way:
																		const remaining = parsed.filter((_, i) => i !== originalIdx);
																		// Re-run mapping for safety or just let user re-select?
																		// Let's just remove and not worry about shifting too much,
																		// but dests are keyed by index. We MUST shift keys.
																		const reindexed: Record<number, string> = {};
																		remaining.forEach((_, newI) => {
																			// Map old to new? Complex.
																			// Easier: Just don't use index keys if possible, but strict array.
																			// For now, re-map logic:
																			const oldKey = newI >= originalIdx ? newI + 1 : newI;
																			reindexed[newI] = newDest[oldKey];
																		});
																		return reindexed;
																	});
																}}
															>
																<DeleteIcon fontSize="small" />
															</IconButton>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</TableContainer>
							</Box>

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
					<Button variant="contained" onClick={onSubmitAI} disabled={saving || parsed.filter(p => p.selected !== false).length === 0}>
						เพิ่มจาก AI ({parsed.filter(p => p.selected !== false).length} วิชา)
					</Button>
				)}
			</DialogActions>

			{/* Blocking Alert for Missing Sector */}
			<Dialog open={!!missingSectorAlert} maxWidth="sm" fullWidth>
				<DialogTitle>ไม่พบข้อมูลปีการศึกษา</DialogTitle>
				<DialogContent>
					<Typography>
						พบวิชาของปีการศึกษา {missingSectorAlert?.year} ภาคเรียนที่ {missingSectorAlert?.term} ซึ่งยังไม่มีในระบบ
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						กรุณาเลือกการดำเนินการ:
					</Typography>
				</DialogContent>
				<DialogActions sx={{ flexDirection: 'column', gap: 1, alignItems: 'stretch', p: 2 }}>
					<Button variant="contained" onClick={handleCreateSector} disabled={creatingSector}>
						{creatingSector ? "กำลังสร้าง..." : `สร้างภาคการศึกษา ${missingSectorAlert?.year}/${missingSectorAlert?.term == 0 ? "ฤดูร้อน" : missingSectorAlert?.term} ใหม่`}
					</Button>
					<Button variant="outlined" color="error" onClick={handleDeleteMissing} disabled={creatingSector}>
						ลบวิชาของเทอมนี้ออก
					</Button>
					<Button variant="text" color="inherit" onClick={handleCancelAnalysis} disabled={creatingSector}>
						ยกเลิก
					</Button>
				</DialogActions>
			</Dialog>
		</Dialog>
	);
};

export default AddSubjectModal;

