import React from "react";
import { Modal, Box, TextField, Button, Typography, Link } from "@mui/material";
import { Label } from "@mui/icons-material";

interface LoginModalProps {
    open: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
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
                >
                    <Box>
                        <Typography variant="body1" component="p">
                            ชื่อผู้ใช้ :
                        </Typography>
                        <TextField
                            variant="outlined"
                            fullWidth
                        />
                    </Box>
                    <Box>
                        <Typography variant="body1" component="p">
                            รหัสผ่าน :
                        </Typography>
                        <TextField
                            type="password"
                            variant="outlined"
                            fullWidth
                        />
                    </Box>
                </Box>
                <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                    เข้าสู่ระบบ
                </Button>
                <Link href="#" variant="body2" sx={{ textAlign: 'right' }}>
                    ลืมรหัสผ่าน?
                </Link>
            </Box>
        </Modal>
    );
};

export default LoginModal;
