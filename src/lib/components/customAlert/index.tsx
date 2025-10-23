import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

const CustomAlert = ({ message, severity }: { message: string; severity: 'error' | 'warning' | 'info' | 'success' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        left: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'center',
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      <Alert
        variant="filled"
        severity={severity}
        sx={{ width: { xs: '100%', sm: 'auto' }, maxWidth: { sm: 420, md: 480 } }}
      >
        {message}
      </Alert>
    </Box>
  );
};

export default CustomAlert;
