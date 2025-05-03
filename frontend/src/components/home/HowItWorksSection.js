import React from 'react';
import { Box, Container, Typography, Stepper, Step, StepLabel, StepContent, Paper, useTheme, useMediaQuery } from '@mui/material';

const steps = [
  {
    label: '가상 휴먼 생성',
    description: '당신의 성향과 관심사를 반영한 개인화된 가상 휴먼을 생성합니다. 가상 휴먼은 학습을 통해 지속적으로 발전합니다.',
  },
  {
    label: '매칭 및 네트워킹',
    description: 'LLM이 당신의 관심사, 목표, 활동 등을 분석하여 유사한 성향의 사용자나 가상 휴먼을 매칭합니다.',
  },
  {
    label: '협업 활동 참여',
    description: '자동으로 생성된 협업 프로젝트에 참여하거나, 직접 협업 그룹을 생성할 수 있습니다. 가상 휴먼이 당신을 도와 활동합니다.',
  },
  {
    label: '가치 창출 및 보상',
    description: '협업이나 기여를 통해 가치를 창출하면 NFT 형태의 보상을 받을 수 있습니다. 이 자산은 마켓플레이스에서 거래될 수 있습니다.',
  },
  {
    label: '소셜 생태계 확장',
    description: '계속해서 활동하고 기여할수록 당신의 영향력과 네트워크가 확장됩니다. 가상 휴먼과 함께 지속적으로 발전합니다.',
  },
];

const HowItWorksSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ py: 8, backgroundColor: theme.palette.grey[50] }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            어떻게 작동하나요?
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ maxWidth: '800px', mx: 'auto' }}
          >
            VirtualSphere의 동작 방식을 이해하고 활용하는 방법을 알아보세요
          </Typography>
        </Box>

        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          <Stepper orientation={isMobile ? 'vertical' : 'horizontal'} sx={{ mb: 4 }}>
            {steps.map((step, index) => (
              <Step key={index} completed={false}>
                <StepLabel>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {step.label}
                  </Typography>
                </StepLabel>
                {isMobile && (
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepContent>
                )}
              </Step>
            ))}
          </Stepper>

          {!isMobile && (
            <Box sx={{ mt: 4 }}>
              {steps.map((step, index) => (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 3,
                    mb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {index + 1}. {step.label}
                  </Typography>
                  <Typography variant="body1">{step.description}</Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HowItWorksSection;
