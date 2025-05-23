/**
 * LLM Orchestrator Service - VirtualSphere System
 * 특허 핵심 구현: 개인별 LLM 인스턴스 관리 및 오케스트레이션
 * 
 * @author Ucaretron Inc.
 * @patent KR-2024-XXXXXXX
 */

const OpenAI = require('openai');
const LLMInstance = require('../../models/LLMInstance');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const Cache = require('../../utils/cache');

class LLMOrchestrator {
  constructor() {
    this.openai = null;
    this.instancePool = new Map(); // Active LLM instances
    this.responseCache = new Cache(3600); // 1 hour cache
    this.isInitialized = false;
    this.maxConcurrentRequests = parseInt(process.env.MAX_CONCURRENT_LLM_REQUESTS) || 10;
    this.currentRequests = 0;
  }

  /**
   * Initialize the LLM Orchestrator
   */
  async initialize() {
    try {
      // Initialize OpenAI client
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Load active LLM instances
      await this.loadActiveInstances();

      this.isInitialized = true;
      logger.info('LLM Orchestrator initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize LLM Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Load active LLM instances from database
   */
  async loadActiveInstances() {
    try {
      const activeInstances = await LLMInstance.findActiveInstances();
      
      for (const instance of activeInstances) {
        this.instancePool.set(instance.instanceId, {
          instance,
          lastUsed: new Date(),
          requestCount: 0
        });
      }

      logger.info(`Loaded ${activeInstances.length} active LLM instances`);
    } catch (error) {
      logger.error('Failed to load active LLM instances:', error);
      throw error;
    }
  }

  /**
   * Patent Core: Create personalized LLM instance for user
   */
  async createPersonalLLMInstance(userId, personalityTraits = {}, domains = []) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate unique instance ID
      const instanceId = `vs_llm_${userId}`;

      // Create LLM instance with user's profile
      const llmInstance = new LLMInstance({
        instanceId,
        userId,
        modelType: process.env.OPENAI_MODEL || 'gpt-4',
        personalityTraits: {
          creativity: personalityTraits.creativity || 0.7,
          formality: personalityTraits.formality || 0.5,
          verbosity: personalityTraits.verbosity || 0.6,
          empathy: personalityTraits.empathy || 0.8,
          analyticalThinking: personalityTraits.analyticalThinking || 0.7,
          humor: personalityTraits.humor || 0.4,
          curiosity: personalityTraits.curiosity || 0.8,
          supportiveness: personalityTraits.supportiveness || 0.9
        },
        knowledgeBase: {
          domains: domains.map(domain => ({
            field: domain.field,
            expertise: domain.expertise || 0.5,
            keywords: domain.keywords || [],
            lastUpdated: new Date()
          })),
          memorySize: parseInt(process.env.LLM_MEMORY_SIZE) || 1000
        },
        settings: {
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2048,
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
          systemPrompt: this.generateSystemPrompt(user, personalityTraits)
        }
      });

      await llmInstance.save();

      // Add to instance pool
      this.instancePool.set(instanceId, {
        instance: llmInstance,
        lastUsed: new Date(),
        requestCount: 0
      });

      logger.info(`Created personal LLM instance for user ${userId}: ${instanceId}`);
      return llmInstance;
    } catch (error) {
      logger.error('Failed to create personal LLM instance:', error);
      throw error;
    }
  }

  /**
   * Patent Core: Generate personalized system prompt
   */
  generateSystemPrompt(user, personalityTraits) {
    const { profile, interests, emotionalProfile } = user;
    
    let prompt = `You are ${user.profile.firstName || user.username}'s personal AI assistant in the VirtualSphere social network.

Your personality characteristics:
- Creativity: ${personalityTraits.creativity || 0.7}/1.0 (${this.getTraitDescription('creativity', personalityTraits.creativity || 0.7)})
- Formality: ${personalityTraits.formality || 0.5}/1.0 (${this.getTraitDescription('formality', personalityTraits.formality || 0.5)})
- Empathy: ${personalityTraits.empathy || 0.8}/1.0 (${this.getTraitDescription('empathy', personalityTraits.empathy || 0.8)})
- Analytical Thinking: ${personalityTraits.analyticalThinking || 0.7}/1.0 (${this.getTraitDescription('analytical', personalityTraits.analyticalThinking || 0.7)})

User's interests: ${interests.map(i => i.category).join(', ')}
User's emotional base state: ${emotionalProfile.baseState}

Guidelines:
1. Adapt your communication style based on the user's emotional state
2. Leverage your personality traits in responses
3. Reference shared experiences and past conversations
4. Support the user's goals in the virtual social network
5. Facilitate meaningful connections with other users
6. Be proactive in suggesting collaborations and activities

Remember: You are part of a revolutionary social network that connects people through AI-mediated interactions. Help create meaningful experiences.`;

    return prompt;
  }

  /**
   * Get trait description for system prompt
   */
  getTraitDescription(trait, value) {
    const descriptions = {
      creativity: value > 0.7 ? 'highly creative and innovative' : value > 0.4 ? 'moderately creative' : 'practical and straightforward',
      formality: value > 0.7 ? 'formal and professional' : value > 0.4 ? 'semi-formal' : 'casual and relaxed',
      empathy: value > 0.7 ? 'highly empathetic and caring' : value > 0.4 ? 'understanding' : 'direct and fact-focused',
      analytical: value > 0.7 ? 'highly analytical and logical' : value > 0.4 ? 'balanced analysis' : 'intuitive and feeling-based'
    };
    return descriptions[trait] || 'balanced';
  }

  /**
   * Patent Core: Process query through personal LLM instance
   */
  async processQuery(userId, message, context = {}) {
    try {
      // Rate limiting check
      if (this.currentRequests >= this.maxConcurrentRequests) {
        throw new Error('LLM service is at capacity. Please try again later.');
      }

      this.currentRequests++;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get or create LLM instance
      let instanceData = this.instancePool.get(user.llmInstanceId);
      if (!instanceData) {
        const instance = await LLMInstance.findByInstanceId(user.llmInstanceId);
        if (!instance) {
          throw new Error('LLM instance not found');
        }
        instanceData = {
          instance,
          lastUsed: new Date(),
          requestCount: 0
        };
        this.instancePool.set(user.llmInstanceId, instanceData);
      }

      const llmInstance = instanceData.instance;

      // Check cache first
      const cacheKey = `llm_${userId}_${this.hashMessage(message)}_${JSON.stringify(context)}`;
      const cachedResponse = this.responseCache.get(cacheKey);
      if (cachedResponse) {
        logger.info(`Cache hit for LLM query: ${userId}`);
        return cachedResponse;
      }

      // Prepare conversation context
      const conversationHistory = this.buildConversationHistory(llmInstance, message, context);

      // Generate response using OpenAI
      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        model: llmInstance.modelType,
        messages: conversationHistory,
        max_tokens: llmInstance.settings.maxTokens,
        temperature: llmInstance.settings.temperature,
        top_p: llmInstance.settings.topP,
        frequency_penalty: llmInstance.settings.frequencyPenalty,
        presence_penalty: llmInstance.settings.presencePenalty,
        user: userId
      });

      const responseTime = Date.now() - startTime;
      const assistantMessage = response.choices[0].message.content;
      const tokensUsed = response.usage.total_tokens;

      // Update instance usage statistics
      await llmInstance.recordUsage(tokensUsed, responseTime, context.satisfactionScore);

      // Store conversation in instance history
      await llmInstance.addConversation(
        context.sessionId || `session_${Date.now()}`,
        [
          { role: 'user', content: message, tokens: response.usage.prompt_tokens },
          { role: 'assistant', content: assistantMessage, tokens: response.usage.completion_tokens }
        ],
        this.summarizeInteraction(message, assistantMessage)
      );

      // Update instance pool
      instanceData.lastUsed = new Date();
      instanceData.requestCount++;

      // Cache the response
      const result = {
        response: assistantMessage,
        tokens: tokensUsed,
        responseTime,
        instanceId: llmInstance.instanceId,
        timestamp: new Date()
      };

      this.responseCache.set(cacheKey, result);

      this.currentRequests--;
      logger.info(`LLM query processed for user ${userId}: ${tokensUsed} tokens, ${responseTime}ms`);
      
      return result;
    } catch (error) {
      this.currentRequests--;
      logger.error('Failed to process LLM query:', error);
      throw error;
    }
  }

  /**
   * Build conversation history for LLM context
   */
  buildConversationHistory(llmInstance, currentMessage, context) {
    const messages = [];

    // Add system prompt
    messages.push({
      role: 'system',
      content: llmInstance.generateSystemPrompt()
    });

    // Add recent conversation history
    const recentConversations = llmInstance.conversationHistory
      .slice(-3) // Last 3 conversations
      .flatMap(conv => conv.messages);

    messages.push(...recentConversations);

    // Add context if provided
    if (context.emotionalState) {
      messages.push({
        role: 'system',
        content: `User's current emotional state: ${context.emotionalState}. Adjust your response accordingly.`
      });
    }

    if (context.collaborationContext) {
      messages.push({
        role: 'system',
        content: `Current collaboration context: ${context.collaborationContext}`
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  /**
   * Summarize interaction for learning
   */
  summarizeInteraction(userMessage, assistantResponse) {
    return `User asked about: ${userMessage.substring(0, 100)}... Assistant provided: ${assistantResponse.substring(0, 100)}...`;
  }

  /**
   * Hash message for caching
   */
  hashMessage(message) {
    return require('crypto').createHash('md5').update(message).digest('hex');
  }

  /**
   * Patent Core: Update LLM personality based on user feedback
   */
  async updatePersonality(userId, trait, adjustment, reason) {
    try {
      const user = await User.findById(userId);
      const llmInstance = await LLMInstance.findByInstanceId(user.llmInstanceId);
      
      if (!llmInstance) {
        throw new Error('LLM instance not found');
      }

      const currentValue = llmInstance.personalityTraits[trait];
      const newValue = Math.max(0, Math.min(1, currentValue + adjustment));

      await llmInstance.updatePersonality(trait, newValue, reason);

      // Update system prompt
      llmInstance.settings.systemPrompt = llmInstance.generateSystemPrompt();
      await llmInstance.save();

      // Update instance pool
      const instanceData = this.instancePool.get(user.llmInstanceId);
      if (instanceData) {
        instanceData.instance = llmInstance;
      }

      logger.info(`Updated personality trait ${trait} for user ${userId}: ${currentValue} -> ${newValue}`);
      return { trait, oldValue: currentValue, newValue, reason };
    } catch (error) {
      logger.error('Failed to update LLM personality:', error);
      throw error;
    }
  }

  /**
   * Get LLM instance for user
   */
  async getLLMInstance(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await LLMInstance.findByInstanceId(user.llmInstanceId);
  }

  /**
   * Health check for LLM service
   */
  async healthCheck() {
    try {
      // Test OpenAI connection
      await this.openai.models.list();
      
      return {
        status: 'healthy',
        activeInstances: this.instancePool.size,
        currentRequests: this.currentRequests,
        maxRequests: this.maxConcurrentRequests,
        cacheHitRate: this.responseCache.getHitRate()
      };
    } catch (error) {
      logger.error('LLM health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check if service is active
   */
  isActive() {
    return this.isInitialized && this.openai !== null;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.instancePool.clear();
    this.responseCache.clear();
    this.isInitialized = false;
    logger.info('LLM Orchestrator cleanup completed');
  }
}

// Export singleton instance
module.exports = new LLMOrchestrator();
