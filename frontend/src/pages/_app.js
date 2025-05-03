import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '../theme';
import { AuthProvider } from '../contexts/AuthContext';
import { VirtualHumanProvider } from '../contexts/VirtualHumanContext';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import AppLayout from '../components/layout/AppLayout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <AuthProvider>
          <VirtualHumanProvider>
            <AppLayout>
              <Component {...pageProps} />
            </AppLayout>
          </VirtualHumanProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default MyApp;
