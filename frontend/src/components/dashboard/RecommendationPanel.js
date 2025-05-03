import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Divider, Box, Tabs, Tab, Button, CircularProgress } from '@mui/material';
import { Person, Folder, Psychology } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { getRecommendedUsers } from '../../services/userService';
import { getRecommendedProjects } from '../../services/projectService';
import { useAuth } from '../../contexts/AuthContext';

const RecommendationPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      
      try {
        // 추천 사용자 가져오기
        const usersResponse = await getRecommendedUsers(3);
        if (usersResponse.success) {
          setRecommendedUsers(usersResponse.data.users || []);
        }
        
        // 추천 프로젝트 가져오기
        const projectsResponse = await getRecommendedProjects();
        if (projectsResponse.success) {
          setRecommendedProjects(projectsResponse.data.projects || []);
        }
      } catch (error) {
        console.error('추천 데이터 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          추천을 보려면 로그인하세요.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="recommendations tabs"
        variant="fullWidth"
      >
        <Tab label="사용자" icon={<Person />} iconPosition="start" />
        <Tab label="프로젝트" icon={<Folder />} iconPosition="start" />
      </Tabs>
      
      <Box sx={{ mt: 2 }}>
        {tabValue === 0 && (
          <List disablePadding>
            {recommendedUsers.length > 0 ? (
              recommendedUsers.map((user, index) => (
                <React.Fragment key={user._id || index}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => router.push(`/users/${user._id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={user.profileImage || `/avatars/user-${(user._id?.charAt(0) || '0').charCodeAt(0) % 5 + 1}.jpg`}
                        alt={user.username}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {user.fullName || user.username}
                        </Typography>
                      }
                      secondary={
                        <>
                          {user.interests?.slice(0, 2).join(', ')}
                          {user.interests?.length > 2 && ' ...'}
                          <Box sx={{ mt: 0.5 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'inline-block',
                                bgcolor: 'primary.main', 
                                color: 'white', 
                                px: 0.8, 
                                py: 0.2, 
                                borderRadius: 1,
                                fontSize: '0.7rem'
                              }}
                            >
                              유사도 {Math.round(user.similarityScore * 100)}%
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                  {index < recommendedUsers.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  추천할 사용자가 없습니다.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  관심사를 설정하여 더 정확한 추천을 받아보세요.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => router.push('/settings/profile')}
                >
                  관심사 설정하기
                </Button>
              </Box>
            )}
          </List>
        )}
        
        {tabValue === 1 && (
          <List disablePadding>
            {recommendedProjects.length > 0 ? (
              recommendedProjects.map((project, index) => (
                <React.Fragment key={project._id || index}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => router.push(`/projects/${project._id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <Folder />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {project.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {project.description}
                          </Typography>
                          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={project.creator?.profileImage} 
                              alt={project.creator?.username}
                              sx={{ width: 16, height: 16, mr: 0.5 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {project.creator?.username || 'Unknown'}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                  {index < recommendedProjects.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  추천할 프로젝트가 없습니다.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => router.push('/projects/create')}
                >
                  프로젝트 생성하기
                </Button>
              </Box>
            )}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default RecommendationPanel;
