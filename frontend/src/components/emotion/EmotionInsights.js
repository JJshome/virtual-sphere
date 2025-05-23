import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Paper,
  Divider,
  Alert,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Info,
  CheckCircle,
  Psychology,
  Lightbulb,
  LocalFireDepartment
} from '@mui/icons-material';
import { format } from 'date-fns';

const insightIcons = {
  trend: <TrendingUp />,
  warning: <Warning />,
  info: <Info />,
  success: <CheckCircle />,
  analysis: <Psychology />,
  suggestion: <Lightbulb />,
  alert: <LocalFireDepartment />
};

const insightColors = {
  trend: '#2196f3',
  warning: '#ff9800',
  info: '#00bcd4',
  success: '#4caf50',
  analysis: '#9c27b0',
  suggestion: '#ffc107',
  alert: '#f44336'
};

const EmotionInsights = ({ insights = [] }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const getInsightIcon = (type) => {
    return insightIcons[type] || insightIcons.info;
  };

  const getInsightColor = (type) => {
    return insightColors[type] || insightColors.info;
  };

  const formatInsightMessage = (insight) => {
    if (!insight.metadata) return insight.message;

    let message = insight.message;
    
    // Replace placeholders with actual values
    if (insight.metadata.emotionChanges) {
      const changes = insight.metadata.emotionChanges;
      message = message.replace(
        /\{emotionChange\}/g,
        `${changes.from} → ${changes.to}`
      );
    }

    if (insight.metadata.percentage) {
      message = message.replace(
        /\{percentage\}/g,
        `${insight.metadata.percentage}%`
      );
    }

    if (insight.metadata.timeRange) {
      message = message.replace(
        /\{timeRange\}/g,
        insight.metadata.timeRange
      );
    }

    return message;
  };

  if (!insights || insights.length === 0) {
    return (
      <Box p={2}>
        <Alert severity="info">
          No insights available yet. Keep tracking your emotions to get personalized insights!
        </Alert>
      </Box>
    );
  }

  return (
    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
      {insights.map((insight, index) => (
        <React.Fragment key={insight._id || index}>
          <ListItem alignItems="flex-start">
            <ListItemIcon>
              <Avatar
                sx={{
                  bgcolor: getInsightColor(insight.type),
                  width: 36,
                  height: 36
                }}
              >
                {getInsightIcon(insight.type)}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">
                    {formatInsightMessage(insight)}
                  </Typography>
                  <Chip
                    label={insight.priority}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(insight.priority),
                      color: 'white',
                      fontSize: '0.7rem',
                      height: 20
                    }}
                  />
                </Box>
              }
              secondary={
                <Box mt={1}>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(insight.createdAt), 'MMM dd, HH:mm')}
                  </Typography>
                  
                  {insight.recommendation && (
                    <Paper
                      elevation={0}
                      sx={{
                        mt: 1,
                        p: 1,
                        backgroundColor: 'action.hover',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="caption">
                        💡 {insight.recommendation}
                      </Typography>
                    </Paper>
                  )}

                  {insight.metadata?.tags && (
                    <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
                      {insight.metadata.tags.map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
          {index < insights.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default EmotionInsights;
