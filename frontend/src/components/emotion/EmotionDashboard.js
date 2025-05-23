import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Mood,
  MoodBad,
  SentimentSatisfiedAlt,
  SentimentVeryDissatisfied,
  Psychology,
  Timeline,
  Insights,
  Refresh
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import emotionService from '../../services/emotionService';
import EmotionChart from './EmotionChart';
import EmotionHistory from './EmotionHistory';
import EmotionInsights from './EmotionInsights';

const emotionIcons = {
  happy: <Mood style={{ color: '#4caf50' }} />,
  sad: <MoodBad style={{ color: '#2196f3' }} />,
  neutral: <SentimentSatisfiedAlt style={{ color: '#ff9800' }} />,
  angry: <SentimentVeryDissatisfied style={{ color: '#f44336' }} />
};

const EmotionDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    loadEmotionData();
  }, [selectedPeriod]);

  const loadEmotionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, insightsData] = await Promise.all([
        emotionService.getEmotionAnalytics(selectedPeriod),
        emotionService.getEmotionInsights(10)
      ]);

      setAnalytics(analyticsData.data);
      setInsights(insightsData.data || []);
    } catch (err) {
      console.error('Error loading emotion data:', err);
      setError('Failed to load emotion data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEmotionScore = (emotion) => {
    if (!analytics?.emotionBreakdown) return 0;
    return analytics.emotionBreakdown[emotion] || 0;
  };

  const getStabilityColor = (score) => {
    if (score >= 0.8) return '#4caf50';
    if (score >= 0.6) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Emotion Analytics Dashboard
        </Typography>
        <Box>
          {['1d', '7d', '30d', '90d'].map((period) => (
            <Chip
              key={period}
              label={period}
              onClick={() => setSelectedPeriod(period)}
              color={selectedPeriod === period ? 'primary' : 'default'}
              sx={{ mr: 1 }}
            />
          ))}
          <IconButton onClick={loadEmotionData} size="small">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Emotion Overview Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Psychology color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Dominant Emotion</Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center" py={2}>
                  {emotionIcons[analytics?.dominantEmotion || 'neutral']}
                  <Typography variant="h4" sx={{ ml: 2 }}>
                    {(analytics?.dominantEmotion || 'neutral').toUpperCase()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Timeline color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Emotional Stability</Typography>
                </Box>
                <Box py={2}>
                  <Typography variant="h4" align="center" gutterBottom>
                    {((analytics?.emotionalStability || 0) * 100).toFixed(0)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(analytics?.emotionalStability || 0) * 100}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getStabilityColor(analytics?.emotionalStability || 0),
                        borderRadius: 5
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Insights color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Analyses</Typography>
                </Box>
                <Typography variant="h3" align="center" sx={{ py: 2 }}>
                  {analytics?.totalCount || 0}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Mood color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Complexity Score</Typography>
                </Box>
                <Typography variant="h3" align="center" sx={{ py: 2 }}>
                  {((analytics?.averageComplexity || 0) * 100).toFixed(0)}%
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Emotion Breakdown */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Emotion Trends
            </Typography>
            <EmotionChart data={analytics?.trends || {}} />
          </Paper>
        </Grid>

        {/* Recent Insights */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Insights
            </Typography>
            <EmotionInsights insights={insights} />
          </Paper>
        </Grid>

        {/* Emotion History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Emotion History
            </Typography>
            <EmotionHistory period={selectedPeriod} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmotionDashboard;
