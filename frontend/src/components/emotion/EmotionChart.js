import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Box, Typography, Tab, Tabs } from '@mui/material';

const EmotionChart = ({ data }) => {
  const [tabValue, setTabValue] = React.useState(0);

  // Transform data for time series chart
  const transformTimeSeriesData = () => {
    if (!data || typeof data !== 'object') return [];
    
    const dates = Object.keys(data).sort();
    return dates.map(date => {
      const dayData = data[date];
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        happy: dayData?.happy || 0,
        sad: dayData?.sad || 0,
        angry: dayData?.angry || 0,
        fear: dayData?.fear || 0,
        surprise: dayData?.surprise || 0,
        disgust: dayData?.disgust || 0,
        neutral: dayData?.neutral || 0
      };
    });
  };

  // Transform data for radar chart
  const transformRadarData = () => {
    if (!data || typeof data !== 'object') return [];
    
    const emotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'];
    const totals = {};
    
    // Calculate totals for each emotion
    Object.values(data).forEach(dayData => {
      emotions.forEach(emotion => {
        totals[emotion] = (totals[emotion] || 0) + (dayData[emotion] || 0);
      });
    });
    
    // Calculate average
    const numDays = Object.keys(data).length || 1;
    
    return emotions.map(emotion => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      value: Math.round((totals[emotion] || 0) / numDays * 100)
    }));
  };

  const timeSeriesData = transformTimeSeriesData();
  const radarData = transformRadarData();

  const emotionColors = {
    happy: '#4caf50',
    sad: '#2196f3',
    angry: '#f44336',
    fear: '#9c27b0',
    surprise: '#ff9800',
    disgust: '#795548',
    neutral: '#607d8b'
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Time Series" />
        <Tab label="Emotion Distribution" />
        <Tab label="Emotion Radar" />
      </Tabs>

      {tabValue === 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(emotionColors).map(emotion => (
              <Line
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stroke={emotionColors[emotion]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {tabValue === 1 && (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(emotionColors).map(emotion => (
              <Area
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stackId="1"
                stroke={emotionColors[emotion]}
                fill={emotionColors[emotion]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {tabValue === 2 && (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="emotion" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Emotion Distribution"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {(!timeSeriesData || timeSeriesData.length === 0) && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={400}
        >
          <Typography variant="body1" color="textSecondary">
            No emotion data available for the selected period
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EmotionChart;
