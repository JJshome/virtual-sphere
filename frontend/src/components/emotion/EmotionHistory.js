import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Box,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  Delete,
  Lock,
  Timeline,
  Mood,
  MoodBad,
  SentimentSatisfiedAlt,
  SentimentVeryDissatisfied
} from '@mui/icons-material';
import { format } from 'date-fns';
import emotionService from '../../services/emotionService';

const emotionConfig = {
  happy: { icon: <Mood />, color: '#4caf50' },
  sad: { icon: <MoodBad />, color: '#2196f3' },
  angry: { icon: <SentimentVeryDissatisfied />, color: '#f44336' },
  neutral: { icon: <SentimentSatisfiedAlt />, color: '#ff9800' },
  fear: { icon: <MoodBad />, color: '#9c27b0' },
  surprise: { icon: <Mood />, color: '#00bcd4' },
  disgust: { icon: <SentimentVeryDissatisfied />, color: '#795548' }
};

const EmotionHistory = ({ period = '7d' }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [period]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await emotionService.getEmotionHistory();
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error loading emotion history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (emotion) => {
    setSelectedEmotion(emotion);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedEmotion(null);
  };

  const handleDelete = async (emotionId) => {
    if (window.confirm('Are you sure you want to delete this emotion data?')) {
      try {
        await emotionService.deleteEmotionData(emotionId);
        loadHistory();
      } catch (error) {
        console.error('Error deleting emotion data:', error);
      }
    }
  };

  const handleAnonymize = async (emotionId) => {
    if (window.confirm('Are you sure you want to anonymize this emotion data?')) {
      try {
        await emotionService.anonymizeEmotionData(emotionId);
        loadHistory();
      } catch (error) {
        console.error('Error anonymizing emotion data:', error);
      }
    }
  };

  const getEmotionChip = (emotion) => {
    const config = emotionConfig[emotion] || emotionConfig.neutral;
    return (
      <Chip
        icon={config.icon}
        label={emotion}
        size="small"
        style={{
          backgroundColor: config.color,
          color: 'white'
        }}
      />
    );
  };

  const getDataTypeChip = (dataType) => {
    const colors = {
      facial: '#4caf50',
      voice: '#2196f3',
      text: '#ff9800',
      physiological: '#9c27b0',
      composite: '#f44336'
    };

    return (
      <Chip
        label={dataType}
        size="small"
        style={{
          backgroundColor: colors[dataType] || '#757575',
          color: 'white'
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Data Type</TableCell>
              <TableCell>Emotion</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Complexity</TableCell>
              <TableCell>Privacy</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((emotion) => (
                <TableRow key={emotion._id || emotion.id}>
                  <TableCell>
                    {format(new Date(emotion.timestamp), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {getDataTypeChip(emotion.dataType)}
                  </TableCell>
                  <TableCell>
                    {getEmotionChip(emotion.primaryEmotion)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {(emotion.confidence * 100).toFixed(0)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Timeline fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {(emotion.emotionalComplexity * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {emotion.privacy.anonymized ? (
                      <Chip
                        icon={<Lock />}
                        label="Anonymized"
                        size="small"
                        color="default"
                      />
                    ) : (
                      <Chip
                        label={emotion.privacy.shareLevel}
                        size="small"
                        color="primary"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(emotion)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {!emotion.privacy.anonymized && (
                      <>
                        <Tooltip title="Anonymize">
                          <IconButton
                            size="small"
                            onClick={() => handleAnonymize(emotion._id || emotion.id)}
                          >
                            <Lock />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(emotion._id || emotion.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={history.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        {selectedEmotion && (
          <>
            <DialogTitle>
              Emotion Analysis Details
            </DialogTitle>
            <DialogContent>
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Timestamp
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedEmotion.timestamp), 'MMMM dd, yyyy HH:mm:ss')}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Primary Emotion
                </Typography>
                <Box mt={1}>
                  {getEmotionChip(selectedEmotion.primaryEmotion)}
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  All Emotions
                </Typography>
                <Box mt={1}>
                  {Object.entries(selectedEmotion.emotions || {}).map(([emotion, score]) => (
                    <Box key={emotion} display="flex" alignItems="center" mt={0.5}>
                      <Typography variant="body2" style={{ width: 100 }}>
                        {emotion}:
                      </Typography>
                      <Box flexGrow={1} mx={2}>
                        <Box
                          style={{
                            width: `${score * 100}%`,
                            height: 20,
                            backgroundColor: emotionConfig[emotion]?.color || '#757575',
                            borderRadius: 4
                          }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {(score * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {selectedEmotion.context && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Context
                  </Typography>
                  <Typography variant="body2">
                    Activity: {selectedEmotion.context.activity || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Location: {selectedEmotion.context.location || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Environment: {selectedEmotion.context.environmentalFactors?.join(', ') || 'N/A'}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default EmotionHistory;
