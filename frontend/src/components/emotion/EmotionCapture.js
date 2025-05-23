import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CameraAlt,
  Mic,
  TextFields,
  Stop,
  Send,
  Psychology,
  Mood,
  MoodBad,
  SentimentSatisfiedAlt
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import emotionService from '../../services/emotionService';

const EmotionCapture = ({ onEmotionProcessed }) => {
  const [captureMode, setCaptureMode] = useState('text');
  const [isCapturing, setIsCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleModeChange = (event, newMode) => {
    if (newMode !== null && !isCapturing) {
      setCaptureMode(newMode);
      setResult(null);
      setError(null);
    }
  };

  // Facial emotion capture
  const captureFacialEmotion = useCallback(async () => {
    if (!webcamRef.current) return;

    try {
      setProcessing(true);
      setError(null);
      
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      // Convert base64 to blob
      const base64Data = imageSrc.split(',')[1];
      const response = await emotionService.processFacialEmotion(base64Data);
      
      setResult(response.data);
      if (onEmotionProcessed) {
        onEmotionProcessed(response.data);
      }
    } catch (err) {
      console.error('Error processing facial emotion:', err);
      setError('Failed to process facial emotion. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [onEmotionProcessed]);

  // Voice emotion capture
  const startVoiceCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsCapturing(true);
    } catch (err) {
      console.error('Error starting voice capture:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopVoiceCapture = () => {
    if (mediaRecorderRef.current && isCapturing) {
      mediaRecorderRef.current.stop();
      setIsCapturing(false);
    }
  };

  const processVoiceEmotion = async () => {
    if (!audioBlob) return;

    try {
      setProcessing(true);
      setError(null);

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        const response = await emotionService.processVoiceEmotion(base64Audio);
        
        setResult(response.data);
        setAudioBlob(null);
        
        if (onEmotionProcessed) {
          onEmotionProcessed(response.data);
        }
      };
    } catch (err) {
      console.error('Error processing voice emotion:', err);
      setError('Failed to process voice emotion. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Text emotion processing
  const processTextEmotion = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await emotionService.processTextEmotion(textInput);
      
      setResult(response.data);
      if (onEmotionProcessed) {
        onEmotionProcessed(response.data);
      }
    } catch (err) {
      console.error('Error processing text emotion:', err);
      setError('Failed to process text emotion. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      happy: <Mood style={{ color: '#4caf50' }} />,
      sad: <MoodBad style={{ color: '#2196f3' }} />,
      neutral: <SentimentSatisfiedAlt style={{ color: '#ff9800' }} />
    };
    return icons[emotion] || icons.neutral;
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Capture Your Emotions
        </Typography>

        {/* Mode Selection */}
        <Box display="flex" justifyContent="center" mb={3}>
          <ToggleButtonGroup
            value={captureMode}
            exclusive
            onChange={handleModeChange}
            aria-label="capture mode"
          >
            <ToggleButton value="facial" aria-label="facial">
              <CameraAlt sx={{ mr: 1 }} />
              Facial
            </ToggleButton>
            <ToggleButton value="voice" aria-label="voice">
              <Mic sx={{ mr: 1 }} />
              Voice
            </ToggleButton>
            <ToggleButton value="text" aria-label="text">
              <TextFields sx={{ mr: 1 }} />
              Text
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Capture Interface */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                {/* Facial Capture */}
                {captureMode === 'facial' && (
                  <Box>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<CameraAlt />}
                      onClick={captureFacialEmotion}
                      disabled={processing}
                      sx={{ mt: 2 }}
                    >
                      Capture Emotion
                    </Button>
                  </Box>
                )}

                {/* Voice Capture */}
                {captureMode === 'voice' && (
                  <Box textAlign="center" py={4}>
                    {isCapturing ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <IconButton
                          color="error"
                          onClick={stopVoiceCapture}
                          sx={{ p: 4, bgcolor: 'error.light' }}
                        >
                          <Stop sx={{ fontSize: 48 }} />
                        </IconButton>
                      </motion.div>
                    ) : (
                      <IconButton
                        color="primary"
                        onClick={startVoiceCapture}
                        sx={{ p: 4, bgcolor: 'primary.light' }}
                      >
                        <Mic sx={{ fontSize: 48 }} />
                      </IconButton>
                    )}
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      {isCapturing ? 'Recording... Click to stop' : 'Click to start recording'}
                    </Typography>
                    {audioBlob && (
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={processVoiceEmotion}
                        disabled={processing}
                        sx={{ mt: 2 }}
                      >
                        Process Recording
                      </Button>
                    )}
                  </Box>
                )}

                {/* Text Capture */}
                {captureMode === 'text' && (
                  <Box>
                    <TextField
                      multiline
                      rows={6}
                      fullWidth
                      placeholder="Type your thoughts here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      variant="outlined"
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Psychology />}
                      onClick={processTextEmotion}
                      disabled={processing || !textInput.trim()}
                      sx={{ mt: 2 }}
                    >
                      Analyze Emotion
                    </Button>
                  </Box>
                )}

                {processing && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <CircularProgress />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Results Display */}
          <Grid item xs={12} md={6}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Emotion Analysis Results
                    </Typography>

                    <Box display="flex" alignItems="center" mb={2}>
                      {getEmotionIcon(result.primaryEmotion)}
                      <Typography variant="h4" sx={{ ml: 2 }}>
                        {result.primaryEmotion?.toUpperCase()}
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Confidence
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <LinearProgress
                          variant="determinate"
                          value={result.confidence * 100}
                          sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2">
                          {(result.confidence * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        All Emotions
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {Object.entries(result.emotions || {}).map(([emotion, score]) => (
                          <Chip
                            key={emotion}
                            label={`${emotion}: ${(score * 100).toFixed(0)}%`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>

                    {result.emotionalComplexity && (
                      <Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Emotional Complexity
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={result.emotionalComplexity * 100}
                          color="secondary"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default EmotionCapture;
