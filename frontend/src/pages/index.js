import React from 'react';
import { Box, Typography, Button, Grid, Paper, Container } from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import Head from 'next/head';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/register');
    }
  };

  return (
    <>
      <Head>
        <title>VirtualSphere - LLM 기반 가상 소셜 네트워크</title>
        <meta name="description" content="LLM(Large Language Model)을 활용한 혁신적인 가상 소셜 네트워크 시스템. 가상 휴먼 생성, 협업 환경, 블록체인 기반 경제 시스템을 경험하세요." />
      </Head>
      
      <Box sx={{ flexGrow: 1 }}>
        {/* 히어로 섹션 */}
        <HeroSection onGetStarted={handleGetStarted} />
        
        {/* 주요 기능 섹션 */}
        <FeaturesSection />
        
        {/* 작동 방식 섹션 */}
        <HowItWorksSection />
        
        {/* 사용자 후기 섹션 */}
        <TestimonialsSection />
        
        {/* CTA 섹션 */}
        <Box sx={{ py: 8, backgroundColor: 'primary.main', color: 'white' }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="h2" gutterBottom>
              지금 바로 VirtualSphere를 경험해보세요
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              혁신적인 가상 소셜 네트워크에서 나만의 가상 휴먼을 만들고, 협업하고, 가치를 창출하세요.
            </Typography>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              onClick={handleGetStarted}
            >
              시작하기
            </Button>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default HomePage;
