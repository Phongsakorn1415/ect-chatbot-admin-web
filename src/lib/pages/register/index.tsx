'use client'

import React from "react";
import { Box, Paper, Typography, TextField, Button, Alert, Stack, CircularProgress, Backdrop, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

const RegisterPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const [isLoading, setIsLoading] = React.useState(true);

    const [title, setTitle] = React.useState("");
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [inviteExpired, setInviteExpired] = React.useState(false);
    const [countdown, setCountdown] = React.useState(10);
    const [role, setRole] = React.useState<string>("TEACHER");
    const [embedErrorModal, setEmbedErrorModal] = React.useState<{ open: boolean }>({ open: false });

    const [isTokenValid, setIsTokenValid] = React.useState(true);

    const canSubmit = React.useMemo(() => {
        return (
            !!token &&
            !inviteExpired &&
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password) &&
            password === confirmPassword &&
            !submitting
        );
    }, [token, inviteExpired, password, confirmPassword, submitting]);

    // Prefill name fields from invite if available
    React.useEffect(() => {
        let ignore = false;
        const loadInvite = async () => {
            if (!token) return;
            try {
                setIsLoading(true);
                const res = await fetch(`/api/invite/accept?token=${encodeURIComponent(token)}`);
                if (!res.ok) {
                    setError("Error 404: ไม่พบการเชิญของท่าน กรุณาตรวจสอบลิงก์อีกครั้ง หรือติดต่อผู้ดูแลระบบ");
                    setIsTokenValid(false);
                    return;
                } // middleware should have validated, but guard anyway
                const data = await res.json();
                const iv = data?.invite || {};
                if (!ignore) {
                    if (iv.title != null) setTitle(iv.title);
                    if (iv.firstName != null) setFirstName(iv.firstName);
                    if (iv.lastName != null) setLastName(iv.lastName);
                    if (iv.role != null) setRole(iv.role);
                    // detect expired invite from API
                    if (iv.expired === true || iv.status === "EXPIRED") {
                        setInviteExpired(true);
                    }
                }
            } catch (e) {
                setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setIsLoading(false);
            }
        };
        loadInvite();
        return () => {
            ignore = true;
        };
    }, [token]);

    // countdown when invite is expired
    React.useEffect(() => {
        if (!inviteExpired) return;
        setCountdown(10); // reset to 10 seconds when entering expired state
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    router.push("/");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [inviteExpired, router]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!token) {
            setError("ไม่พบโทเคนคำเชิญ");
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข");
            return;
        }
        if (password !== confirmPassword) {
            setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/invite/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password, title, firstName, lastName }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
                return;
            }

            const responseData = await res.json();

            // เฉพาะ TEACHER เท่านั้นที่ต้องทำ Embedding
            if (role === "TEACHER" || responseData.role === "TEACHER") {
                const embedres = await fetch("/api/embed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ teacher_id: [responseData.user_id] }),
                });

                if (!embedres.ok) {
                    setEmbedErrorModal({ open: true });
                    return; // หยุดและให้ UI แสดง Modal กั้นไว้
                }
            }

            setSuccess("ลงทะเบียนสำเร็จ กำลังนำคุณไปยังหน้าเข้าสู่ระบบ…");
            // หน่วงเวลาเล็กน้อยเพื่อให้ผู้ใช้เห็นข้อความสำเร็จ
            setTimeout(() => router.push("/"), 1200);
        } catch (err) {
            setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 5 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
                    ลงทะเบียนสมาชิกใหม่
                </Typography>
                <Typography variant="body1" sx={{ textAlign: "center", mb: 2, display: isTokenValid ? "block" : "none" }}>
                    กรุณากรอกข้อมูลและตั้งรหัสผ่านเพื่อเปิดใช้งานบัญชีจากคำเชิญ
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {inviteExpired && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        คำเชิญนี้หมดอายุแล้ว ระบบจะพาคุณกลับไปหน้าแรกภายใน {countdown} วินาที
                    </Alert>
                )}

                {!inviteExpired && isTokenValid ? (
                    <Box component="form" onSubmit={onSubmit} noValidate>
                        <Stack spacing={2}>
                            {/* Keep token hidden but present */}
                            <input type="hidden" name="token" value={token} />

                            <TextField
                                label="คำนำหน้า"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="เช่น นาย / นาง / นางสาว / ดร. เป็นต้น"
                                required
                                fullWidth
                            />
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <TextField
                                    label="ชื่อจริง"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    fullWidth
                                />
                                <TextField
                                    label="นามสกุล"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    fullWidth
                                />
                            </Stack>

                            <TextField
                                label="รหัสผ่าน"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                helperText="อย่างน้อย 8 ตัวอักษร (ประกอบด้วยตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข)"
                                fullWidth
                                required
                            />
                            <TextField
                                label="ยืนยันรหัสผ่าน"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                fullWidth
                                required
                                error={!!confirmPassword && password !== confirmPassword}
                                helperText={
                                    !!confirmPassword && password !== confirmPassword
                                        ? "รหัสผ่านไม่ตรงกัน"
                                        : ""
                                }
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={!canSubmit}
                            >
                                {submitting ? (
                                    <>
                                        <CircularProgress size={20} sx={{ mr: 1 }} /> กำลังลงทะเบียน…
                                    </>
                                ) : (
                                    "ยืนยันการลงทะเบียน"
                                )}
                            </Button>
                        </Stack>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                            <Button variant="outlined" fullWidth onClick={() => router.push("/")}>กลับไปหน้าแรก</Button>
                        </Box>
                    </>
                )}



                {inviteExpired && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Button variant="outlined" onClick={() => router.push("/")}>กลับไปหน้าแรก</Button>
                    </Box>
                )}
            </Paper>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isLoading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* Embed Error Modal */}
            <Dialog open={embedErrorModal.open} maxWidth="sm" fullWidth>
                <DialogTitle>ลงทะเบียนสำเร็จ (แต่ AI ยังไม่รู้จักชื่อของคุณ)</DialogTitle>
                <DialogContent>
                    <Typography>
                        บัญชีเข้าใช้งานระบบของคุณได้ถูกสร้างขึ้นเรียบร้อยแล้ว
                    </Typography>
                    <Typography color="error" sx={{ mt: 1 }}>
                        อย่างไรก็ตาม เกิดข้อขัดข้องในขั้นตอน "การสอน AI" ทำให้ระบบแชทบอทยังไม่สามารถค้นหาหรือตอบคำถามโดยใช้ชื่อคุณได้ในขณะนี้
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        กรุณาแจ้งปัญหาให้ผู้ดูแลระบบ (Admin) ทราบ เพื่อให้ดำเนินการสอน AI ใหม่อีกครั้งในภายหลัง
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'end' }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                            setEmbedErrorModal({ open: false });
                            setSuccess("ลงทะเบียนสำเร็จ กำลังนำคุณไปยังหน้าเข้าสู่ระบบ…");
                            setTimeout(() => router.push("/"), 1200);
                        }}
                    >
                        เข้าใจแล้ว
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RegisterPage;