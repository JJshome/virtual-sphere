import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useSnackbar } from '../../contexts/SnackbarContext';

const AlertSnackbar = () => {
  const { snackbar, closeSnackbar } = useSnackbar();

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={closeSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={closeSnackbar} 
        severity={snackbar.severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default AlertSnackbar;
