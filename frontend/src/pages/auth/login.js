import React, { useState, useEffect } from 'react';
import { TextField, Button, Paper, Typography, Box, Link, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import NextLink from 'next/link';
import Head from 'next/head';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { redirect } = router.query;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirect || '/dashboard');
    }
  }, [isAuthenticated, loading, redirect, router]);

  const validate = () => {
    const newErrors = {};
    
    if (!email) newErrors.email = '이메일을 입력해주세요.';
    if (!password) newErrors.password = '비밀번호를 입력해주세요.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        showSnackbar('로그인 성공!', 'success');
        router.push(redirect || '/dashboard');
      } else {
        showSnackbar(result.message || '로그인에 실패했습니다. 다시 시도해주세요.', 'error');
      }
    } catch (error) {
      showSnackbar('로그인 중 오류가 발생했습니다.', 'error');
      console.error('로그인 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>로그인 | VirtualSphere</title>
      </Head>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 64px)',
        py: 4
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: '400px',
            width: '100%'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              로그인
            </Typography>
            <Typography variant="body2" color="textSecondary">
              VirtualSphere에 오신 것을 환영합니다
            </Typography>
          </Box>
          
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="이메일"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
              <NextLink href="/auth/forgot-password" passHref>
                <Link variant="body2">
                  비밀번호를 잊으셨나요?
                </Link>
              </NextLink>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 2, mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : '로그인'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                계정이 없으신가요?{' '}
                <NextLink href="/auth/register" passHref>
                  <Link variant="body2">
                    회원가입
                  </Link>
                </NextLink>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default Login;
