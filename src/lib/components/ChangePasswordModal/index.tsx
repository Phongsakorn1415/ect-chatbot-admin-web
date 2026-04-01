'use client';

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress,
  IconButton, InputAdornment, Stepper, Step, StepLabel, Alert, Stack
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = ['ยืนยันตัวตน', 'กรอก OTP', 'ตั้งรหัสใหม่'];

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);

  // Step 0 state
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Step 1 state
  const [otp, setOtp] = useState('');

  // Step 2 state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordChecks = [
    { label: 'อย่างน้อย 8 ตัวอักษร', isValid: newPassword.length >= 8 },
    { label: 'ตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)', isValid: /[a-z]/.test(newPassword) },
    { label: 'ตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)', isValid: /[A-Z]/.test(newPassword) },
    { label: 'ตัวเลขอย่างน้อย 1 ตัว (0-9)', isValid: /\d/.test(newPassword) },
  ];

  const resetAll = () => {
    setActiveStep(0);
    setCurrentPassword('');
    setShowCurrentPassword(false);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Step 0: ยืนยันรหัสเดิม และขอ OTP
  const handleSendOtp = async () => {
    setError('');
    if (!currentPassword) {
      setError('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'CHANGE_PASSWORD', currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        return;
      }
      setActiveStep(1);
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: ตรวจสอบ OTP format เบื้องต้น แล้วไปขั้น 2
  const handleVerifyOtpFormat = () => {
    setError('');
    if (!otp || otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      setError('กรุณากรอก OTP 6 หลัก');
      return;
    }
    setActiveStep(2);
  };

  // Step 2: Submit เปลี่ยนรหัส
  const handleChangePassword = async () => {
    setError('');
    if (!newPassword) {
      setError('กรุณากรอกรหัสผ่านใหม่');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'CHANGE_PASSWORD', otp: otp.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        // ถ้า OTP ผิด กลับไป step 1
        if (data.message?.includes('OTP')) {
          setActiveStep(1);
          setOtp('');
        }
        setError(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        return;
      }
      setSuccess(true);
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (success) {
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h6" color="success.main" gutterBottom>เปลี่ยนรหัสผ่านสำเร็จ! ✓</Typography>
          <Typography variant="body2" color="text.secondary">
            รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อยแล้ว
          </Typography>
        </Box>
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              เพื่อความปลอดภัย กรุณากรอกรหัสผ่านปัจจุบันของคุณ จากนั้นระบบจะส่ง OTP ไปยังอีเมลของคุณ
            </Typography>
            <TextField
              label="รหัสผ่านปัจจุบัน"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp(); }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPassword(p => !p)} edge="end">
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ระบบได้ส่ง OTP 6 หลักไปยังอีเมลของคุณแล้ว รหัสจะหมดอายุใน 10 นาที
            </Typography>
            <TextField
              label="รหัส OTP 6 หลัก"
              type="text"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
              }}
              fullWidth
              required
              inputProps={{ maxLength: 6, style: { letterSpacing: '0.3em', fontSize: '1.4rem', textAlign: 'center' } }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOtpFormat(); }}
            />
            <Button variant="text" size="small" sx={{ alignSelf: 'flex-start' }}
              onClick={() => { setError(''); handleSendOtp(); }}
              disabled={loading}
            >
              ส่ง OTP อีกครั้ง
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <TextField
                label="รหัสผ่านใหม่"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                required
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(p => !p)} edge="end">
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ mt: 1, ml: 1 }}>
                {passwordChecks.map((check, index) => (
                  <Stack key={index} direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    {check.isValid ? (
                      <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                    ) : (
                      <CancelIcon color="error" sx={{ fontSize: 18 }} />
                    )}
                    <Typography variant="body2" color={check.isValid ? "success.main" : "text.secondary"}>
                      {check.label}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Box>
            <TextField
              label="ยืนยันรหัสผ่านใหม่"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              autoComplete="new-password"
              error={!!confirmPassword && newPassword !== confirmPassword}
              helperText={!!confirmPassword && newPassword !== confirmPassword ? 'รหัสผ่านไม่ตรงกัน' : ''}
              onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(); }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(p => !p)} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  const renderActions = () => {
    if (success) {
      return (
        <Button variant="contained" onClick={handleClose}>ปิด</Button>
      );
    }

    return (
      <>
        <Button onClick={handleClose} disabled={loading}>ยกเลิก</Button>
        {activeStep === 0 && (
          <Button variant="contained" onClick={handleSendOtp} disabled={loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'ส่ง OTP'}
          </Button>
        )}
        {activeStep === 1 && (
          <>
            <Button onClick={() => { setActiveStep(0); setOtp(''); setError(''); }} disabled={loading}>ย้อนกลับ</Button>
            <Button variant="contained" onClick={handleVerifyOtpFormat} disabled={loading}>ถัดไป</Button>
          </>
        )}
        {activeStep === 2 && (
          <>
            <Button onClick={() => { setActiveStep(1); setNewPassword(''); setConfirmPassword(''); setError(''); }} disabled={loading}>ย้อนกลับ</Button>
            <Button variant="contained" color="success" onClick={handleChangePassword} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'เปลี่ยนรหัสผ่าน'}
            </Button>
          </>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
      <DialogContent>
        {!success && (
          <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {renderStepContent()}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordModal;
