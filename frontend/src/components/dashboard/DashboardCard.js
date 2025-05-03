import React from 'react';
import { Paper, Box, Typography, useTheme } from '@mui/material';
import { Folder, Person, Token, Insights } from '@mui/icons-material';

const getIcon = (iconName, size = 40) => {
  const iconProps = { sx: { fontSize: size } };
  
  switch (iconName) {
    case 'folder':
      return <Folder {...iconProps} />;
    case 'person':
      return <Person {...iconProps} />;
    case 'token':
      return <Token {...iconProps} />;
    case 'insights':
      return <Insights {...iconProps} />;
    default:
      return <Folder {...iconProps} />;
  }
};

const DashboardCard = ({ title, value, icon, color, onClick }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
          '& .icon-wrapper': {
            transform: 'scale(1.1)',
          }
        } : {},
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          className="icon-wrapper"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: color || theme.palette.primary.main,
            color: 'white',
            borderRadius: '50%',
            width: 60,
            height: 60,
            mr: 2,
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          {getIcon(icon)}
        </Box>
        
        <Box>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default DashboardCard;
