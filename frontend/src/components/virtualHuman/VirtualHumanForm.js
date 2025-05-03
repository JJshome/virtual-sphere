import React, { useState } from 'react';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Chip, Typography, CircularProgress, Paper, IconButton, Grid } from '@mui/material';
import { AddCircle, Cancel } from '@mui/icons-material';
import { useVirtualHuman } from '../../contexts/VirtualHumanContext';

const personalityOptions = [
  { value: 'analytical', label: '분석적' },
  { value: 'creative', label: '창의적' },
  { value: 'supportive', label: '지원적' },
  { value: 'proactive', label: '능동적' },
  { value: 'balanced', label: '균형있는' }
];

const VirtualHumanForm = ({ initialData, onSubmit, submitButtonText = '생성하기' }) => {
  const [formData, setFormData] = useState({
    name: '',
    personality: 'balanced',
    description: '',
    interests: [],
    skills: [],
    goals: [],
    ...initialData
  });
  
  const [interestInput, setInterestInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { addVirtualHuman, updateVirtualHumanData } = useVirtualHuman();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddInterest = () => {
    if (interestInput.trim() !== '' && !formData.interests.includes(interestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };
  
  const handleAddSkill = () => {
    if (skillInput.trim() !== '' && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };
  
  const handleAddGoal = () => {
    if (goalInput.trim() !== '' && !formData.goals.includes(goalInput.trim())) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, goalInput.trim()]
      }));
      setGoalInput('');
    }
  };
  
  const handleRemoveItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      let result;
      
      if (initialData && initialData._id) {
        // 수정
        result = await updateVirtualHumanData(initialData._id, formData);
      } else {
        // 생성
        result = await addVirtualHuman(formData);
      }
      
      if (result.success) {
        if (onSubmit) {
          onSubmit(result.virtualHuman);
        }
      }
    } catch (error) {
      console.error('가상 휴먼 저장 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {initialData && initialData._id ? '가상 휴먼 수정' : '새 가상 휴먼 생성'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="이름"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="personality-label">성격</InputLabel>
              <Select
                labelId="personality-label"
                name="personality"
                value={formData.personality}
                onChange={handleChange}
                label="성격"
              >
                {personalityOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="설명"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="가상 휴먼에 대한 설명을 입력하세요..."
            />
          </Grid>
          
          {/* 관심사 섹션 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              관심사
            </Typography>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <TextField
                fullWidth
                label="관심사 추가"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                placeholder="여행, 독서, 코딩 등..."
              />
              <IconButton color="primary" onClick={handleAddInterest}>
                <AddCircle />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.interests.map((interest, index) => (
                <Chip
                  key={index}
                  label={interest}
                  onDelete={() => handleRemoveItem('interests', index)}
                  deleteIcon={<Cancel />}
                />
              ))}
            </Box>
          </Grid>
          
          {/* 기술 섹션 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              기술
            </Typography>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <TextField
                fullWidth
                label="기술 추가"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="프로그래밍, 디자인, 마케팅 등..."
              />
              <IconButton color="primary" onClick={handleAddSkill}>
                <AddCircle />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  onDelete={() => handleRemoveItem('skills', index)}
                  deleteIcon={<Cancel />}
                />
              ))}
            </Box>
          </Grid>
          
          {/* 목표 섹션 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              목표
            </Typography>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <TextField
                fullWidth
                label="목표 추가"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGoal())}
                placeholder="새로운 언어 배우기, 프로젝트 완료하기 등..."
              />
              <IconButton color="primary" onClick={handleAddGoal}>
                <AddCircle />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.goals.map((goal, index) => (
                <Chip
                  key={index}
                  label={goal}
                  onDelete={() => handleRemoveItem('goals', index)}
                  deleteIcon={<Cancel />}
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={24} /> : submitButtonText}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default VirtualHumanForm;
