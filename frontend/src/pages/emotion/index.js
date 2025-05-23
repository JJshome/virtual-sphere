import React from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import Layout from '../../components/common/Layout';
import EmotionDashboard from '../../components/emotion/EmotionDashboard';
import EmotionCapture from '../../components/emotion/EmotionCapture';
import { useAuth } from '../../hooks/useAuth';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`emotion-tabpanel-${index}`}
      aria-labelledby={`emotion-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EmotionPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tabValue, setTabValue] = React.useState(0);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEmotionProcessed = (emotionData) => {
    // Handle processed emotion data
    console.log('Emotion processed:', emotionData);
    // You could show a success message or update the dashboard
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <Typography>Loading...</Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box py={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Emotion Analysis Center
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Track and understand your emotional patterns with our advanced AI-powered analysis
          </Typography>

          <Paper sx={{ width: '100%', mt: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Dashboard" />
              <Tab label="Capture Emotion" />
            </Tabs>
          </Paper>

          <TabPanel value={tabValue} index={0}>
            <EmotionDashboard />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <EmotionCapture onEmotionProcessed={handleEmotionProcessed} />
          </TabPanel>
        </Box>
      </Container>
    </Layout>
  );
};

export default EmotionPage;
