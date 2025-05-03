import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Divider, Box, CircularProgress } from '@mui/material';
import { Group, Chat, Task, Token, Create } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// 더미 데이터 - 나중에 API로 교체 예정
const dummyActivities = [
  {
    id: 1,
    type: 'chat',
    title: '가상 휴먼과 대화',
    entity: '아인스타인',
    time: '10분 전'
  },
  {
    id: 2,
    type: 'task',
    title: '작업 완료',
    entity: '데이터 분석 보고서',
    time: '1시간 전'
  },
  {
    id: 3,
    type: 'join',
    title: '새 프로젝트 참여',
    entity: '기후변화 대응 연구',
    time: '3시간 전'
  },
  {
    id: 4,
    type: 'nft',
    title: 'NFT 획득',
    entity: '영향력있는 기여자 토큰',
    time: '어제'
  },
  {
    id: 5,
    type: 'create',
    title: '가상 휴먼 생성',
    entity: '다빈치',
    time: '어제'
  }
];

const getActivityIcon = (type) => {
  switch (type) {
    case 'chat':
      return <Chat sx={{ color: '#2196f3' }} />;
    case 'task':
      return <Task sx={{ color: '#4caf50' }} />;
    case 'join':
      return <Group sx={{ color: '#9c27b0' }} />;
    case 'nft':
      return <Token sx={{ color: '#ff9800' }} />;
    case 'create':
      return <Create sx={{ color: '#f44336' }} />;
    default:
      return <Chat />;
  }
};

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // API 호출 시뮤레이션
    const fetchActivities = () => {
      setTimeout(() => {
        setActivities(dummyActivities);
        setLoading(false);
      }, 1000);
    };
    
    if (isAuthenticated) {
      fetchActivities();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }
  
  if (!isAuthenticated || activities.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          최근 활동이 없습니다.
        </Typography>
      </Box>
    );
  }
  
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {activities.map((activity, index) => (
        <React.Fragment key={activity.id}>
          <ListItem alignItems="flex-start">
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'background.paper' }}>
                {getActivityIcon(activity.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={activity.title}
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {activity.entity}
                  </Typography>
                  {` — ${activity.time}`}
                </React.Fragment>
              }
            />
          </ListItem>
          {index < activities.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ActivityFeed;
