const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const LLMService = require('../services/LLMService');
const VirtualHumanService = require('../services/VirtualHumanService');
const DynamicWorldService = require('../services/DynamicWorldService');
const EmotionService = require('../services/EmotionService');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socketId mapping
    this.worldUsers = new Map(); // worldId -> Set of userIds
    
    this.initialize();
  }

  initialize() {
    // Socket authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication failed: ' + error.message));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    const userId = socket.userId;
    logger.info(`User ${userId} connected via Socket.IO`);
    
    // Store socket mapping
    this.userSockets.set(userId, socket.id);
    
    // Join personal room
    socket.join(`user:${userId}`);

    // Virtual Human events
    this.setupVirtualHumanHandlers(socket);
    
    // Dynamic World events
    this.setupDynamicWorldHandlers(socket);
    
    // Emotion events
    this.setupEmotionHandlers(socket);
    
    // LLM events
    this.setupLLMHandlers(socket);
    
    // Collaboration events
    this.setupCollaborationHandlers(socket);
    
    // General events
    this.setupGeneralHandlers(socket);
    
    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected`);
      this.userSockets.delete(userId);
      
      // Remove from all worlds
      this.worldUsers.forEach((users, worldId) => {
        if (users.has(userId)) {
          users.delete(userId);
          this.io.to(`world:${worldId}`).emit('vs:world:user_left', {
            userId,
            worldId,
            timestamp: new Date()
          });
        }
      });
    });
  }

  setupVirtualHumanHandlers(socket) {
    const userId = socket.userId;

    // Virtual Human autonomous action
    socket.on('vs:vh:action', async (data) => {
      try {
        const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);
        if (!virtualHuman) {
          return socket.emit('error', { message: 'Virtual human not found' });
        }

        // Process autonomous action
        await VirtualHumanService.executeAutonomousAction(virtualHuman, data.action);
        
        // Emit action completed
        socket.emit('vs:vh:action_completed', {
          action: data.action,
          virtualHumanId: virtualHuman._id,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Virtual human action error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Virtual Human interaction
    socket.on('vs:vh:interact', async (data) => {
      try {
        const { targetUserId, interactionType, content } = data;
        
        // Notify target user
        const targetSocketId = this.userSockets.get(targetUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('vs:vh:interaction', {
            fromUserId: userId,
            interactionType,
            content,
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error('Virtual human interaction error:', error);
        socket.emit('error', { message: error.message });
      }
    });
  }

  setupDynamicWorldHandlers(socket) {
    const userId = socket.userId;

    // Join world
    socket.on('vs:world:join', async (data) => {
      try {
        const { worldId } = data;
        
        // Join world in service
        await DynamicWorldService.joinWorld(worldId, userId);
        
        // Join socket room
        socket.join(`world:${worldId}`);
        
        // Track user in world
        if (!this.worldUsers.has(worldId)) {
          this.worldUsers.set(worldId, new Set());
        }
        this.worldUsers.get(worldId).add(userId);
        
        // Notify others in world
        socket.to(`world:${worldId}`).emit('vs:world:user_joined', {
          userId,
          worldId,
          timestamp: new Date()
        });
        
        // Send world state to user
        const world = await DynamicWorldService.getWorld(worldId);
        socket.emit('vs:world:state', {
          worldId,
          state: world
        });
      } catch (error) {
        logger.error('World join error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Leave world
    socket.on('vs:world:leave', async (data) => {
      try {
        const { worldId } = data;
        
        // Leave world in service
        await DynamicWorldService.leaveWorld(worldId, userId);
        
        // Leave socket room
        socket.leave(`world:${worldId}`);
        
        // Remove from tracking
        if (this.worldUsers.has(worldId)) {
          this.worldUsers.get(worldId).delete(userId);
        }
        
        // Notify others
        socket.to(`world:${worldId}`).emit('vs:world:user_left', {
          userId,
          worldId,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('World leave error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // World update (structures, environment, etc.)
    socket.on('vs:world:update', async (data) => {
      try {
        const { worldId, updateType, updateData } = data;
        
        // Process update based on type
        let result;
        switch (updateType) {
          case 'structure':
            result = await DynamicWorldService.addStructure(worldId, updateData, userId);
            break;
          case 'emotion':
            const world = await DynamicWorldService.getWorld(worldId);
            await world.updateCollectiveEmotion([{
              userId,
              contribution: updateData.contribution || 0.5
            }]);
            result = world.collectiveEmotionState;
            break;
        }
        
        // Broadcast update to all users in world
        this.io.to(`world:${worldId}`).emit('vs:world:updated', {
          worldId,
          updateType,
          updateData: result,
          userId,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('World update error:', error);
        socket.emit('error', { message: error.message });
      }
    });
  }

  setupEmotionHandlers(socket) {
    const userId = socket.userId;

    // Real-time emotion update
    socket.on('vs:emotion:update', async (data) => {
      try {
        const emotionData = await EmotionService.processEmotionData(userId, data);
        
        // Emit processed emotion
        socket.emit('vs:emotion:processed', {
          emotionId: emotionData._id,
          processedEmotion: emotionData.processedEmotion,
          timestamp: new Date()
        });
        
        // If in a world, update collective emotion
        this.worldUsers.forEach(async (users, worldId) => {
          if (users.has(userId)) {
            const world = await DynamicWorldService.getWorld(worldId);
            await world.updateCollectiveEmotion([{
              userId,
              contribution: 0.5
            }]);
            
            // Notify world of emotion change
            this.io.to(`world:${worldId}`).emit('vs:world:emotion_changed', {
              worldId,
              collectiveEmotion: world.collectiveEmotionState,
              timestamp: new Date()
            });
          }
        });
      } catch (error) {
        logger.error('Emotion update error:', error);
        socket.emit('error', { message: error.message });
      }
    });
  }

  setupLLMHandlers(socket) {
    const userId = socket.userId;

    // LLM query
    socket.on('vs:llm:query', async (data) => {
      try {
        const { prompt, context } = data;
        const llmService = LLMService.getInstance();
        
        const response = await llmService.generateResponse(prompt, userId, context);
        
        socket.emit('vs:llm:response', {
          prompt,
          response,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('LLM query error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // LLM streaming query
    socket.on('vs:llm:stream', async (data) => {
      try {
        const { prompt, context } = data;
        const llmService = LLMService.getInstance();
        
        await llmService.streamResponse(prompt, userId, context, (chunk) => {
          socket.emit('vs:llm:stream_chunk', {
            chunk,
            timestamp: new Date()
          });
        });
        
        socket.emit('vs:llm:stream_complete', {
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('LLM stream error:', error);
        socket.emit('error', { message: error.message });
      }
    });
  }

  setupCollaborationHandlers(socket) {
    const userId = socket.userId;

    // Join collaboration
    socket.on('vs:collab:join', async (data) => {
      try {
        const { collaborationId } = data;
        
        // Join collaboration room
        socket.join(`collab:${collaborationId}`);
        
        // Notify others
        socket.to(`collab:${collaborationId}`).emit('vs:collab:user_joined', {
          userId,
          collaborationId,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Collaboration join error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Collaboration update
    socket.on('vs:collab:update', async (data) => {
      try {
        const { collaborationId, updateType, updateData } = data;
        
        // Broadcast update to all collaboration members
        this.io.to(`collab:${collaborationId}`).emit('vs:collab:updated', {
          userId,
          collaborationId,
          updateType,
          updateData,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Collaboration update error:', error);
        socket.emit('error', { message: error.message });
      }
    });
  }

  setupGeneralHandlers(socket) {
    const userId = socket.userId;

    // User status update
    socket.on('vs:user:status', async (data) => {
      try {
        const { status } = data;
        
        // Broadcast status to all connections
        this.io.emit('vs:user:status_changed', {
          userId,
          status,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Status update error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Direct message
    socket.on('vs:message:send', async (data) => {
      try {
        const { targetUserId, message, type } = data;
        
        const targetSocketId = this.userSockets.get(targetUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('vs:message:received', {
            fromUserId: userId,
            message,
            type,
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error('Message send error:', error);
        socket.emit('error', { message: error.message });
      }
    });
  }
}

module.exports = (io) => {
  return new SocketHandler(io);
};
