"use client";

import React from "react";
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	TextField,
} from "@mui/material";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import { useSession } from "next-auth/react";

type Role = "TEACHER" | "ADMIN" | "SUPER_ADMIN";

export interface InviteModalProps {
	open: boolean;
	onClose: () => void;
	onInvited?: (email: string) => void;
	onNotify?: (message: string, severity: 'error' | 'warning' | 'info' | 'success') => void;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
	{ value: "TEACHER", label: "Teacher" },
	{ value: "ADMIN", label: "Admin" },
];

const initialFormState = {
	email: "",
	title: "",
	firstName: "",
	lastName: "",
	role: "TEACHER" as Role,
};

const InviteModal: React.FC<InviteModalProps> = ({ open, onClose, onInvited, onNotify }) => {
	const { data: session } = useSession();
	const inviterID = (session?.user as any)?.id;

	const [form, setForm] = React.useState(initialFormState);
	const [submitting, setSubmitting] = React.useState(false);
	// alerts are delegated to parent via onNotify

	React.useEffect(() => {
		if (!open) {
			// reset state when closed
			setForm(initialFormState);
			setSubmitting(false);
		}
	}, [open]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		// Basic validations
		if (!form.email.trim()) {
			onNotify?.("กรุณากรอกอีเมลผู้รับคำเชิญ", 'error');
			return;
		}
		const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
		if (!emailRegex.test(form.email.trim())) {
			onNotify?.("รูปแบบอีเมลไม่ถูกต้อง", 'error');
			return;
		}
		if (!inviterID) {
			onNotify?.("ไม่พบข้อมูลผู้เชิญ กรุณาเข้าสู่ระบบใหม่", 'error');
			return;
		}

		try {
			setSubmitting(true);
			const res = await fetch("/api/invite", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: form.email.trim(),
					title: form.title || undefined,
					firstName: form.firstName || undefined,
					lastName: form.lastName || undefined,
					role: form.role,
					inviterID,
				}),
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				onNotify?.(data?.message || "ไม่สามารถส่งคำเชิญได้ กรุณาลองใหม่อีกครั้ง", 'error');
				return;
			}

			onNotify?.("ส่งคำเชิญสำเร็จ", 'success');
			onInvited?.(form.email.trim());
			onClose();
		} catch (err) {
			onNotify?.("เกิดข้อผิดพลาดระหว่างการส่งคำเชิญ", 'error');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<MailOutlineRoundedIcon /> เชิญผู้ใช้งานใหม่
			</DialogTitle>
			<DialogContent>
				<Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
											<Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
												<TextField
													required
													fullWidth
													type="email"
													label="อีเมลผู้รับคำเชิญ"
													name="email"
													value={form.email}
													onChange={handleChange}
													placeholder="name@example.com"
												/>

															<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
																<TextField
																	fullWidth
																	label="คำนำหน้า (ไม่บังคับ)"
																	name="title"
																	value={form.title}
																	onChange={handleChange}
																	placeholder="เช่น นาย, นาง, ดร."
																/>

													<TextField
														fullWidth
														label="ชื่อ (ไม่บังคับ)"
														name="firstName"
														value={form.firstName}
														onChange={handleChange}
													/>

													<TextField
														fullWidth
														label="นามสกุล (ไม่บังคับ)"
														name="lastName"
														value={form.lastName}
														onChange={handleChange}
													/>
												</Box>

												<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
													<TextField
														select
														fullWidth
														label="Role"
														name="role"
														value={form.role}
														onChange={handleChange}
														helperText="ค่าเริ่มต้นเป็น Teacher"
													>
														{ROLE_OPTIONS.map((r) => (
															<MenuItem key={r.value} value={r.value}>
																{r.label}
															</MenuItem>
														))}
													</TextField>
												</Box>
											</Box>

				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={submitting}>
					ปิด
				</Button>
				<Button
					onClick={handleSubmit as any}
					variant="contained"
					startIcon={submitting ? <CircularProgress color="inherit" size={18} /> : undefined}
					disabled={submitting}
				>
					{submitting ? "กำลังส่ง..." : "ส่งคำเชิญ"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default InviteModal;

