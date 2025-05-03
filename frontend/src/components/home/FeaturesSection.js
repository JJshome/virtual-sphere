import React from 'react';
import { Box, Container, Grid, Typography, Paper, useTheme } from '@mui/material';
import { 
  Psychology, 
  Groups, 
  AutoAwesome, 
  SentimentSatisfied, 
  Token,
  VrHeadset
} from '@mui/icons-material';

const Feature = ({ icon, title, description }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-10px)',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
        },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          borderRadius: '50%',
          width: '70px',
          height: '70px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" component="h3" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: '가상 휴먼 생성',
      description:
        'LLM 기반의 개인화된 가상 휴먼을 생성하고 대화하며, 당신을 대신해 활동하게 할 수 있습니다.',
    },
    {
      icon: <Groups sx={{ fontSize: 40 }} />,
      title: '지능형 사용자 매칭',
      description:
        '데이터 기반의 매칭 시스템을 통해 공통된 관심사와 목표를 가진 사용자들을 연결해줍니다.',
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 40 }} />,
      title: '협업 환경',
      description:
        '자동화된 협업 프로젝트와 실시간 데이터 분석을 통해 효율적인 협업을 지원합니다.',
    },
    {
      icon: <SentimentSatisfied sx={{ fontSize: 40 }} />,
      title: '감정 인식 상호작용',
      description:
        '사용자의 감정과 상황을 인식하여 개인화된 반응과 활동을 제안합니다.',
    },
    {
      icon: <Token sx={{ fontSize: 40 }} />,
      title: 'NFT 경제 시스템',
      description:
        '활동과 협업을 통해 획득한 가상 자산은 NFT로 변환하여 거래하고 보상받을 수 있습니다.',
    },
    {
      icon: <VrHeadset sx={{ fontSize: 40 }} />,
      title: 'AR/VR 통합',
      description:
        'AR/VR 기술과 결합하여 더욱 몰입감 있는 가상 현실 경험을 제공합니다.',
    },
  ];

  return (
    <Box sx={{ py: 8, backgroundColor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            주요 기능
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2, maxWidth: '800px', mx: 'auto' }}>
            VirtualSphere가 제공하는 혁신적인 기능들을 알아보세요
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Feature
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection;
