import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, Typography, Avatar, CircularProgress, Divider, IconButton } from '@mui/material';
import { Send, AttachFile, InsertEmoticon, MoreVert } from '@mui/icons-material';
import { chatWithVirtualHuman } from '../../services/virtualHumanService';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';

const Message = ({ message, isUser, timestamp }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 2,
      }}
    >
      <Avatar
        src={isUser ? null : message.virtualHumanAvatar || '/avatars/virtual-human-default.jpg'}
        alt={isUser ? '사용자' : message.virtualHumanName}
        sx={{
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
          width: 40,
          height: 40,
        }}
      >
        {isUser ? message.userInitial : message.virtualHumanInitial}
      </Avatar>
      
      <Box sx={{ maxWidth: '70%', mx: 2 }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.light' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
        </Paper>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: isUser ? 'right' : 'left' }}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Box>
  );
};

const ChatInterface = ({ virtualHuman }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  
  // 가상 휴먼 소개 메시지 추가
  useEffect(() => {
    if (virtualHuman) {
      const introMessage = {
        id: 'intro',
        content: `안녕하세요! 저는 ${virtualHuman.name}입니다. ${virtualHuman.description || ''} 어떤 도움이 필요하신가요?`,
        isUser: false,
        timestamp: new Date().toISOString(),
        virtualHumanName: virtualHuman.name,
        virtualHumanAvatar: virtualHuman.avatar,
        virtualHumanInitial: virtualHuman.name.charAt(0).toUpperCase()
      };
      
      setMessages([introMessage]);
    }
  }, [virtualHuman]);
  
  // 메시지 업데이트되면 스크롤 다운
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;
    
    // 사용자 메시지 추가
    const userMessage = {
      id: `user-${Date.now()}`,
      content: newMessage,
      isUser: true,
      timestamp: new Date().toISOString(),
      userInitial: user?.username?.charAt(0).toUpperCase() || 'U'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);
    
    try {
      // 가상 휴먼 API 호출
      const response = await chatWithVirtualHuman(virtualHuman._id, newMessage);
      
      if (response.success) {
        // 가상 휴먼 응답 추가
        const virtualHumanMessage = {
          id: `vh-${Date.now()}`,
          content: response.data.response,
          isUser: false,
          timestamp: response.data.timestamp || new Date().toISOString(),
          virtualHumanName: virtualHuman.name,
          virtualHumanAvatar: virtualHuman.avatar,
          virtualHumanInitial: virtualHuman.name.charAt(0).toUpperCase()
        };
        
        setMessages(prev => [...prev, virtualHumanMessage]);
      } else {
        showSnackbar('응답을 받아오는 데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('채팅 오류:', error);
      showSnackbar('채팅 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (!virtualHuman) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          가상 휴먼을 선택해주세요.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '70vh',
        maxHeight: '800px',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* 채팅 헤더 */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={virtualHuman.avatar || '/avatars/virtual-human-default.jpg'}
            alt={virtualHuman.name}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {virtualHuman.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{virtualHuman.name}</Typography>
            <Typography variant="body2">
              {virtualHuman.personality || '균형있는'} 성격
            </Typography>
          </Box>
        </Box>
        
        <IconButton color="inherit">
          <MoreVert />
        </IconButton>
      </Box>
      
      <Divider />
      
      {/* 채팅 메시지 영역 */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 2,
        overflowY: 'auto',
        bgcolor: 'grey.50'
      }}>
        {messages.map((message) => (
          <Message 
            key={message.id}
            message={message}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
        
        {/* 로딩 표시 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        
        {/* 스크롤 참조용 div */}
        <div ref={messagesEndRef} />
      </Box>
      
      <Divider />
      
      {/* 메시지 입력 영역 */}
      <Box sx={{ 
        p: 2,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center'
      }}>
        <IconButton disabled>
          <AttachFile />
        </IconButton>
        
        <IconButton disabled>
          <InsertEmoticon />
        </IconButton>
        
        <TextField
          fullWidth
          placeholder="메시지를 입력하세요..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          variant="standard"
          sx={{ mx: 2 }}
        />
        
        <Button
          variant="contained"
          color="primary"
          endIcon={<Send />}
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || loading}
        >
          보내기
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatInterface;
