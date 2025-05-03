import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Rating, useTheme } from '@mui/material';
import { FormatQuote } from '@mui/icons-material';

const testimonials = [
  {
    name: '김영희',
    avatar: '/avatars/user1.jpg',
    role: '소프트웨어 개발자',
    rating: 5,
    content: '가상 휴먼이 저를 대신해 작업을 처리해주는 경험은 정말 혹동적이었어요. 이제 제 시간을 더 가치 있게 활용할 수 있게 되었습니다.'
  },
  {
    name: '이지원',
    avatar: '/avatars/user2.jpg',
    role: '디자이너',
    rating: 4,
    content: '비슷한 관심사를 가진 사람들과 연결된 것이 정말 놀라웠어요. VirtualSphere 덮분에 새로운 협업 기회를 많이 얻을 수 있었습니다.'
  },
  {
    name: '박서준',
    avatar: '/avatars/user3.jpg',
    role: '마케팅 매니저',
    rating: 5,
    content: 'NFT 경제 시스템은 정말 혁신적입니다. 제 활동과 기여가 실제 가치로 인정받는 것이 매우 보람있습니다.'
  },
  {
    name: '조현주',
    avatar: '/avatars/user4.jpg',
    role: '연구원',
    rating: 4,
    content: '협업 프로젝트에서 가상 휴먼들이 제공하는 통창력은 정말 놀라웠어요. 새로운 관점에서 문제를 바라보는 경험이었습니다.'
  }
];

const TestimonialsSection = () => {
  const theme = useTheme();

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            사용자 후기
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ maxWidth: '800px', mx: 'auto' }}
          >
            VirtualSphere를 사용한 사용자들의 실제 경험을 들어보세요
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card 
                elevation={2}
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <CardContent sx={{ pt: 4, px: 4, pb: 4 }}>
                  <Box sx={{ position: 'absolute', top: -20, left: 25 }}>
                    <Avatar
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      sx={{ 
                        width: 64, 
                        height: 64,
                        border: `3px solid ${theme.palette.background.paper}`,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ ml: 10, mb: 3 }}>
                    <Typography variant="h6" component="div">
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {testimonial.role}
                    </Typography>
                    <Rating 
                      value={testimonial.rating} 
                      readOnly 
                      precision={0.5} 
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <FormatQuote 
                      sx={{ 
                        color: theme.palette.primary.main,
                        transform: 'rotate(180deg)',
                        fontSize: 40
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body1" paragraph>
                    {testimonial.content}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;
