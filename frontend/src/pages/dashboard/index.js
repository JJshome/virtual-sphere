import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Button, Divider, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import DashboardCard from '../../components/dashboard/DashboardCard';
import VirtualHumanList from '../../components/virtualHuman/VirtualHumanList';
import ProjectList from '../../components/project/ProjectList';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import RecommendationPanel from '../../components/dashboard/RecommendationPanel';
import { getVirtualHumans } from '../../services/virtualHumanService';
import { getProjects } from '../../services/projectService';
import Head from 'next/head';

const Dashboard = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [virtualHumans, setVirtualHumans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login?redirect=/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated && user) {
        setLoadingData(true);
        try {
          // 가상 휴먼 데이터 가져오기
          const vhResponse = await getVirtualHumans();
          if (vhResponse.success) {
            setVirtualHumans(vhResponse.data.virtualHumans || []);
          }
          
          // 프로젝트 데이터 가져오기
          const projectResponse = await getProjects();
          if (projectResponse.success) {
            setProjects(projectResponse.data.projects || []);
          }
        } catch (error) {
          console.error('대시보드 데이터 로딩 중 오류 발생:', error);
        } finally {
          setLoadingData(false);
        }
      }
    };
    
    fetchData();
  }, [isAuthenticated, user]);

  if (loading || !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>대시보드 | VirtualSphere</title>
      </Head>
      
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          안녕하세요, {user?.fullName || user?.username}님!
        </Typography>
        
        <Grid container spacing={3}>
          {/* 요약 카드 섹션 */}
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard 
              title="가상 휴먼" 
              value={virtualHumans.length} 
              icon="person"
              color="#3f51b5"
              onClick={() => router.push('/virtual-humans')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard 
              title="프로젝트" 
              value={projects.length} 
              icon="folder"
              color="#f50057"
              onClick={() => router.push('/projects')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard 
              title="NFT" 
              value={user?.nfts?.length || 0} 
              icon="token"
              color="#ff9800"
              onClick={() => router.push('/nft/my-nfts')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard 
              title="활동" 
              value={"주간"} 
              icon="insights"
              color="#4caf50"
              onClick={() => router.push('/activity')}
            />
          </Grid>
          
          {/* 가상 휴먼 및 프로젝트 섹션 */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">내 가상 휴먼</Typography>
                <Button variant="outlined" onClick={() => router.push('/virtual-humans/create')}>+ 새 가상 휴먼</Button>
              </Box>
              
              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <VirtualHumanList virtualHumans={virtualHumans.slice(0, 3)} compact />
              )}
              
              {virtualHumans.length > 3 && (
                <Box sx={{ textAlign: 'right', mt: 1 }}>
                  <Button onClick={() => router.push('/virtual-humans')}>더 보기</Button>
                </Box>
              )}
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">내 프로젝트</Typography>
                <Button variant="outlined" onClick={() => router.push('/projects/create')}>+ 새 프로젝트</Button>
              </Box>
              
              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <ProjectList projects={projects.slice(0, 3)} compact />
              )}
              
              {projects.length > 3 && (
                <Box sx={{ textAlign: 'right', mt: 1 }}>
                  <Button onClick={() => router.push('/projects')}>더 보기</Button>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* 추천 및 활동 섹션 */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>추천</Typography>
              <RecommendationPanel />
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>최근 활동</Typography>
              <ActivityFeed />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Dashboard;
