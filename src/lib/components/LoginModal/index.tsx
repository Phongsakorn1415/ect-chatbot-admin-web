"use client";

import { useState, FormEvent } from "react";
import { Modal, Box, TextField, Button, Typography, Link, CircularProgress } from "@mui/material";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginModalProps {
    open: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            // signIn may return undefined in some cases; prefer checking ok and error
            if (res && (res as any).ok) {
                // navigate to dashboard after successful login
                router.push("/dashboard");
                onClose();
            } else {
                setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาด โปรดลองอีกครั้ง");
            // optionally log the error to console for debugging
            // console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="login-modal"
            aria-describedby="login-modal-description"
        >
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 400,
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <Typography variant="h4" component="h2">
                    เข้าสู่ระบบ
                </Typography>
                <Box
                    component="form"
                    sx={{ display: "flex", flexDirection: "column", gap: 2, my: 1 }}
                    onSubmit={handleLogin}
                >
                    <Box>
                        <Typography variant="body1" component="p">
                            ชื่อผู้ใช้ :
                        </Typography>
                        <TextField
                            id="login-email"
                            name="email"
                            type="email"
                            variant="outlined"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            required
                            autoComplete="username"
                            inputProps={{ 'aria-label': 'email' }}
                        />
                    </Box>
                    <Box>
                        <Typography variant="body1" component="p">
                            รหัสผ่าน :
                        </Typography>
                        <TextField
                            id="login-password"
                            name="password"
                            type="password"
                            variant="outlined"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            required
                            autoComplete="current-password"
                            inputProps={{ 'aria-label': 'password' }}
                        />
                    </Box>
                    {error && (
                        <Typography variant="body2" color="error" component="p">
                            {error}
                        </Typography>
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "เข้าสู่ระบบ"}
                    </Button>
                </Box>

                <Link href="#" variant="body2" sx={{ textAlign: 'right' }}>
                    ลืมรหัสผ่าน?
                </Link>
            </Box>
        </Modal>
    );
};

export default LoginModal;
