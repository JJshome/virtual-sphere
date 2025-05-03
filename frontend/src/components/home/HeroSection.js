import React from 'react';
import { Box, Typography, Button, Container, Grid, useTheme, useMediaQuery } from '@mui/material';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';

const HeroSection = ({ onGetStarted }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
        pt: { xs: 8, md: 12 },
        pb: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  mb: 2
                }}
              >
                LLM 기반 가상 휴먼과 함께하는 새로운 소셜 네트워킹
              </Typography>
              
              <Typography 
                variant="h5" 
                component="p"
                sx={{ 
                  mb: 4,
                  fontWeight: 'normal',
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}
              >
                VirtualSphere에서 당신만의 가상 휴먼을 생성하고, 협업하고, 새로운 가치를 창출하세요.
              </Typography>
              
              <Button 
                variant="contained" 
                color="secondary"
                size="large"
                onClick={onGetStarted}
                sx={{ 
                  py: 1.5, 
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: '30px'
                }}
              >
                {isAuthenticated ? '대시보드로 이동' : '지금 시작하기'}
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box 
              sx={{
                position: 'relative',
                height: { xs: '300px', md: '400px' },
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              {/* 히어로 영역에 표시할 이미지/그래픽 요소 */}
              <Box 
                sx={{
                  position: 'relative',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  p: 2,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  width: '80%',
                  height: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Typography variant="h3" sx={{ color: 'white', textAlign: 'center', mb: 2 }}>
                  Virtual Sphere
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', textAlign: 'center' }}>
                  혁신적인 LLM 기반 가상 소셜 네트워크
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;
