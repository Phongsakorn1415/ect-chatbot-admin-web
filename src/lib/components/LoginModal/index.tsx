"use client";

import { useState, FormEvent } from "react";
import {
  Modal, Box, TextField, Button, Typography, Link,
  CircularProgress, useMediaQuery, IconButton, InputAdornment,
  Alert, Stepper, Step, StepLabel,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type ModalView = "login" | "forgot-email" | "forgot-otp" | "forgot-newpassword" | "forgot-success";

const resetSteps = ['กรอกอีเมล', 'กรอก OTP', 'ตั้งรหัสใหม่'];

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  // --- Login state ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // --- Reset Password state ---
  const [view, setView] = useState<ModalView>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const resetAllState = () => {
    setEmail(""); setPassword(""); setShowPassword(false);
    setLoginError(""); setLoginLoading(false);
    setView("login");
    setResetEmail(""); setResetOtp(""); setResetNewPassword("");
    setResetConfirmPassword(""); setShowResetNewPassword(false);
    setShowResetConfirmPassword(false);
    setResetLoading(false); setResetError("");
  };

  const handleClose = () => {
    resetAllState();
    onClose();
  };

  // --- Login ---
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await signIn("credentials", { redirect: false, email, password });
      if (res?.error) {
        setLoginError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }
      router.push("/admin");
      onClose();
    } catch {
      setLoginError("เกิดข้อผิดพลาด โปรดลองอีกครั้ง");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- Reset: Step 1 - ส่ง OTP ---
  const handleSendResetOtp = async () => {
    setResetError("");
    if (!resetEmail || !resetEmail.includes("@")) {
      setResetError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "RESET_PASSWORD", email: resetEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        return;
      }
      setView("forgot-otp");
    } catch {
      setResetError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setResetLoading(false);
    }
  };

  // --- Reset: Step 2 - Validate OTP format ---
  const handleVerifyOtpFormat = () => {
    setResetError("");
    if (!resetOtp || resetOtp.trim().length !== 6 || !/^\d{6}$/.test(resetOtp.trim())) {
      setResetError("กรุณากรอก OTP 6 หลัก");
      return;
    }
    setView("forgot-newpassword");
  };

  // --- Reset: Step 3 - เปลี่ยนรหัส ---
  const handleResetPassword = async () => {
    setResetError("");
    if (!resetNewPassword) { setResetError("กรุณากรอกรหัสผ่านใหม่"); return; }
    if (resetNewPassword.length < 6) { setResetError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    if (resetNewPassword !== resetConfirmPassword) { setResetError("รหัสผ่านไม่ตรงกัน"); return; }
    setResetLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "RESET_PASSWORD",
          email: resetEmail.trim().toLowerCase(),
          otp: resetOtp.trim(),
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message?.includes("OTP")) {
          setView("forgot-otp");
          setResetOtp("");
        }
        setResetError(data.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        return;
      }
      setView("forgot-success");
    } catch {
      setResetError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setResetLoading(false);
    }
  };

  const activeResetStep = view === "forgot-otp" ? 1 : view === "forgot-newpassword" ? 2 : 0;

  const renderContent = () => {
    // --- Login View ---
    if (view === "login") {
      return (
        <>
          <Typography variant={downSm ? 'h5' : 'h4'} component="h2" sx={{ textAlign: 'center' }}>
            เข้าสู่ระบบ
          </Typography>
          <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, my: 1 }} onSubmit={handleLogin}>
            <Box>
              <Typography variant="body1" component="p">ชื่อผู้ใช้ :</Typography>
              <TextField
                id="login-email" name="email" type="email" variant="outlined"
                value={email} onChange={(e) => setEmail(e.target.value)}
                fullWidth required autoComplete="username"
                inputProps={{ 'aria-label': 'email' }}
              />
            </Box>
            <Box>
              <Typography variant="body1" component="p">รหัสผ่าน :</Typography>
              <TextField
                id="login-password" name="password" type={showPassword ? "text" : "password"}
                variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)}
                fullWidth required autoComplete="current-password"
                inputProps={{ 'aria-label': 'password' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            {loginError && <Typography variant="body2" color="error" component="p">{loginError}</Typography>}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loginLoading}>
              {loginLoading ? <CircularProgress size={20} color="inherit" /> : "เข้าสู่ระบบ"}
            </Button>
          </Box>
          <Link
            component="button" variant="body2" sx={{ textAlign: 'right', cursor: 'pointer' }}
            onClick={() => { setLoginError(""); setView("forgot-email"); }}
          >
            ลืมรหัสผ่าน?
          </Link>
        </>
      );
    }

    // --- Forgot Success ---
    if (view === "forgot-success") {
      return (
        <>
          <Typography variant={downSm ? 'h6' : 'h5'} component="h2" sx={{ textAlign: 'center', color: 'success.main' }}>
            เปลี่ยนรหัสผ่านสำเร็จ! ✓
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
          </Typography>
          <Button variant="contained" fullWidth sx={{ mt: 3 }} onClick={() => { setView("login"); setResetError(""); }}>
            กลับสู่หน้าเข้าสู่ระบบ
          </Button>
        </>
      );
    }

    // --- Forgot Password Steps ---
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <IconButton
            size="small"
            onClick={() => {
              setResetError("");
              if (view === "forgot-email") setView("login");
              else if (view === "forgot-otp") setView("forgot-email");
              else if (view === "forgot-newpassword") setView("forgot-otp");
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant={downSm ? 'h6' : 'h5'} component="h2">
            รีเซ็ตรหัสผ่าน
          </Typography>
        </Box>

        <Stepper activeStep={activeResetStep} sx={{ mb: 2 }}>
          {resetSteps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}

        {/* Step 0: กรอก Email */}
        {view === "forgot-email" && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              กรอกอีเมลที่ใช้ลงทะเบียน ระบบจะส่ง OTP ไปให้
            </Typography>
            <TextField
              label="อีเมล" type="email" value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              fullWidth required autoComplete="email"
              onKeyDown={(e) => { if (e.key === "Enter") handleSendResetOtp(); }}
            />
            <Button variant="contained" fullWidth onClick={handleSendResetOtp} disabled={resetLoading}>
              {resetLoading ? <CircularProgress size={20} color="inherit" /> : "ส่ง OTP"}
            </Button>
          </Box>
        )}

        {/* Step 1: กรอก OTP */}
        {view === "forgot-otp" && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              กรอกรหัส OTP 6 หลักที่ส่งไปยัง <strong>{resetEmail}</strong> รหัสจะหมดอายุใน 10 นาที
            </Typography>
            <TextField
              label="รหัส OTP 6 หลัก" type="text" value={resetOtp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setResetOtp(val);
              }}
              fullWidth required
              inputProps={{ maxLength: 6, style: { letterSpacing: '0.3em', fontSize: '1.4rem', textAlign: 'center' } }}
              onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOtpFormat(); }}
            />
            <Button variant="contained" fullWidth onClick={handleVerifyOtpFormat} disabled={resetLoading}>
              ถัดไป
            </Button>
            <Button variant="text" size="small" sx={{ alignSelf: 'center' }}
              onClick={() => { setResetError(""); setView("forgot-email"); handleSendResetOtp(); }}
              disabled={resetLoading}
            >
              ส่ง OTP อีกครั้ง
            </Button>
          </Box>
        )}

        {/* Step 2: ตั้งรหัสใหม่ */}
        {view === "forgot-newpassword" && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="รหัสผ่านใหม่" type={showResetNewPassword ? 'text' : 'password'}
              value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)}
              fullWidth required autoComplete="new-password" helperText="อย่างน้อย 6 ตัวอักษร"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowResetNewPassword(p => !p)} edge="end">
                      {showResetNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="ยืนยันรหัสผ่านใหม่" type={showResetConfirmPassword ? 'text' : 'password'}
              value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)}
              fullWidth required autoComplete="new-password"
              error={!!resetConfirmPassword && resetNewPassword !== resetConfirmPassword}
              helperText={!!resetConfirmPassword && resetNewPassword !== resetConfirmPassword ? 'รหัสผ่านไม่ตรงกัน' : ''}
              onKeyDown={(e) => { if (e.key === "Enter") handleResetPassword(); }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowResetConfirmPassword(p => !p)} edge="end">
                      {showResetConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" color="success" fullWidth onClick={handleResetPassword} disabled={resetLoading}>
              {resetLoading ? <CircularProgress size={20} color="inherit" /> : "เปลี่ยนรหัสผ่าน"}
            </Button>
          </Box>
        )}
      </>
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="login-modal"
      aria-describedby="login-modal-description"
      sx={{ color: 'text.primary' }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: '80vw', sm: 420 },
          maxWidth: 520,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: { xs: 3, sm: 4 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxHeight: { xs: '90vh', sm: 'unset' },
          overflowY: { xs: 'auto', sm: 'visible' },
        }}
      >
        {renderContent()}
      </Box>
    </Modal>
  );
};

export default LoginModal;
