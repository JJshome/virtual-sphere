const { OpenAI } = require('openai');
const { logger } = require('../utils/logger');
const VirtualHuman = require('../models/VirtualHuman');
const User = require('../models/User');
const natural = require('natural');
const NodeCache = require('node-cache');

// API 키 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key'
});

// 캐시 초기화 (메모리 최적화)
const conversationCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * 감정 분석 함수
 * @param {string} text - 분석할 텍스트
 * @returns {Object} - 감정 분석 결과
 */
const analyzeEmotion = async (text) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '다음 텍스트에서 사용자의 감정 상태를 분석하세요. 가능한 감정: happy, sad, stressed, neutral, excited, tired. 결과를 JSON 형식으로 반환하세요: {"emotion": "감정", "confidence": 0-1 사이의 신뢰도, "explanation": "짧은 설명"}'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error('감정 분석 중 오류 발생:', error);
    return { emotion: 'neutral', confidence: 0.5, explanation: '분석 중 오류 발생' };
  }
};

/**
 * 사용자 관심사 분석 및 키워드 추출 함수
 * @param {string} text - 분석할 텍스트
 * @returns {Array} - 키워드 배열
 */
const extractKeywords = (text) => {
  try {
    // TF-IDF 기반 키워드 추출
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    
    // 텍스트 토큰화 (한글 지원)
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text);
    
    // 불용어 필터링 (한글 및 영어 기본 불용어)
    const stopwords = ['은', '는', '이', '가', '의', '에', '을', '를', '으로', 'the', 'is', 'a', 'an'];
    const filteredTokens = tokens.filter(token => 
      !stopwords.includes(token.toLowerCase()) && token.length > 1
    );
    
    tfidf.addDocument(filteredTokens.join(' '));
    
    const keywords = [];
    tfidf.listTerms(0).slice(0, 10).forEach(item => {
      keywords.push({
        term: item.term,
        score: item.tfidf
      });
    });
    
    return keywords.map(k => k.term);
  } catch (error) {
    logger.error('키워드 추출 중 오류 발생:', error);
    return [];
  }
};

/**
 * 대화 내용을 기반으로 사용자 프로필 업데이트 함수
 * @param {string} userId - 사용자 ID
 * @param {string} text - 대화 내용
 */
const updateUserProfile = async (userId, text) => {
  try {
    // 키워드 추출
    const keywords = extractKeywords(text);
    
    // 감정 분석
    const emotionAnalysis = await analyzeEmotion(text);
    
    // 사용자 정보 업데이트
    await User.findByIdAndUpdate(userId, {
      $set: { emotionalState: emotionAnalysis.emotion },
      $addToSet: { interests: { $each: keywords } },
      $push: { 
        interactionData: {
          timestamp: new Date(),
          emotion: emotionAnalysis.emotion,
          keywords,
          content: text.substring(0, 100) // 대화의 일부만 저장
        }
      }
    });
    
    logger.info(`사용자 ${userId}의 프로필이 업데이트되었습니다`);
  } catch (error) {
    logger.error('사용자 프로필 업데이트 중 오류 발생:', error);
  }
};

/**
 * 가상 휴먼 응답 생성 함수
 * @param {string} message - 사용자 메시지
 * @param {string} virtualHumanId - 가상 휴먼 ID
 * @returns {string} - 생성된 응답
 */
const processMessage = async (message, virtualHumanId) => {
  try {
    // 가상 휴먼 정보 조회
    const virtualHuman = await VirtualHuman.findById(virtualHumanId);
    if (!virtualHuman) {
      throw new Error('가상 휴먼을 찾을 수 없습니다');
    }
    
    // 캐시에서 대화 기록 가져오기, 없으면 DB에서 가져오기
    let conversationHistory = conversationCache.get(`conversation_${virtualHumanId}`);
    if (!conversationHistory) {
      conversationHistory = virtualHuman.conversationHistory.slice(-10); // 최근 10개의 대화만 사용
      conversationCache.set(`conversation_${virtualHumanId}`, conversationHistory);
    }
    
    // 시스템 메시지 구성
    const systemMessage = {
      role: 'system',
      content: `당신은 ${virtualHuman.name}이라는 이름의 가상 휴먼입니다. 
      성격: ${virtualHuman.personality} 
      관심사: ${virtualHuman.interests.join(', ')} 
      전문 분야: ${virtualHuman.skills.join(', ')}
      
      당신은 사용자와 자연스럽게 대화하고, 조언하고, 도움을 제공합니다.
      사용자의 감정 상태에 공감하며 적절한 반응을 보입니다.
      ${virtualHuman.description || ''}
      
      특별 지침: 사용자의 질문에 최대한 도움이 되는 정보를 제공하세요. 모르는 내용을 지어내지 마세요.`
    };
    
    // 대화 메시지 배열 구성
    const messages = [
      systemMessage,
      ...conversationHistory.map(conv => ({
        role: conv.role,
        content: conv.content
      })),
      { role: 'user', content: message }
    ];
    
    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const reply = response.choices[0].message.content;
    
    // 대화 기록 업데이트
    conversationHistory.push({ role: 'user', content: message });
    conversationHistory.push({ role: 'assistant', content: reply });
    
    // 캐시 업데이트
    conversationCache.set(`conversation_${virtualHumanId}`, conversationHistory);
    
    // DB에 대화 기록 저장
    await virtualHuman.addConversation('user', message);
    await virtualHuman.addConversation('assistant', reply);
    
    // 사용자 프로필 업데이트
    const ownerId = virtualHuman.owner.toString();
    await updateUserProfile(ownerId, message);
    
    return reply;
  } catch (error) {
    logger.error('메시지 처리 중 오류 발생:', error);
    return '죄송합니다. 메시지를 처리하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }
};

/**
 * 유사한 사용자 찾기 함수
 * @param {string} userId - 사용자 ID
 * @param {number} limit - 반환할 사용자 수
 * @returns {Array} - 유사한 사용자 목록
 */
const findSimilarUsers = async (userId, limit = 5) => {
  try {
    // 대상 사용자 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }
    
    const userInterests = user.interests || [];
    const userGoals = user.goals || [];
    
    // 관심사와 목표가 없는 경우
    if (userInterests.length === 0 && userGoals.length === 0) {
      return [];
    }
    
    // 유사한 사용자 찾기
    const similarUsers = await User.find({
      _id: { $ne: userId }, // 자기 자신 제외
      $or: [
        { interests: { $in: userInterests } },
        { goals: { $in: userGoals } }
      ]
    }).limit(20); // 초기 필터링
    
    // 유사도 계산 및 정렬
    const scoredUsers = similarUsers.map(otherUser => {
      // 관심사 유사도
      let interestScore = 0;
      if (userInterests.length > 0 && otherUser.interests && otherUser.interests.length > 0) {
        const commonInterests = otherUser.interests.filter(interest => 
          userInterests.includes(interest)
        );
        interestScore = commonInterests.length / Math.max(userInterests.length, otherUser.interests.length);
      }
      
      // 목표 유사도
      let goalScore = 0;
      if (userGoals.length > 0 && otherUser.goals && otherUser.goals.length > 0) {
        const commonGoals = otherUser.goals.filter(goal => 
          userGoals.includes(goal)
        );
        goalScore = commonGoals.length / Math.max(userGoals.length, otherUser.goals.length);
      }
      
      // 최종 유사도 점수
      const similarityScore = (interestScore * 0.6) + (goalScore * 0.4);
      
      return {
        user: otherUser,
        similarityScore
      };
    });
    
    // 유사도 기준 정렬 후 상위 n명 반환
    return scoredUsers
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map(item => ({
        _id: item.user._id,
        username: item.user.username,
        fullName: item.user.fullName,
        profileImage: item.user.profileImage,
        bio: item.user.bio,
        interests: item.user.interests,
        goals: item.user.goals,
        similarityScore: item.similarityScore
      }));
  } catch (error) {
    logger.error('유사 사용자 찾기 중 오류 발생:', error);
    return [];
  }
};

/**
 * 협업 프로젝트 자동 생성 함수
 * @param {Array} userIds - 사용자 ID 배열
 * @returns {Object} - 생성된 프로젝트 제안
 */
const generateCollaborationProject = async (userIds) => {
  try {
    // 사용자 정보 조회
    const users = await User.find({ _id: { $in: userIds } });
    if (!users || users.length < 2) {
      throw new Error('프로젝트 생성을 위한 충분한 사용자가 없습니다');
    }
    
    // 사용자 관심사 및 목표 수집
    const allInterests = users.flatMap(user => user.interests || []);
    const allGoals = users.flatMap(user => user.goals || []);
    const allSkills = users.flatMap(user => user.skills || []);
    
    // OpenAI API를 사용하여 프로젝트 제안 생성
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '당신은 여러 사람들의 관심사, 목표, 기술을 분석하여 적합한 협업 프로젝트를 제안하는 전문가입니다. 프로젝트 제안서를 JSON 형식으로 생성하세요.'
        },
        {
          role: 'user',
          content: `다음 사용자들의 정보를 바탕으로 협업 프로젝트를 제안해주세요:
          
          사용자 수: ${users.length}명
          관심사: ${[...new Set(allInterests)].join(', ')}
          목표: ${[...new Set(allGoals)].join(', ')}
          보유 기술: ${[...new Set(allSkills)].join(', ')}
          
          가능한 프로젝트 제안서를 JSON 형식으로 생성해주세요. 
          형식: {"title": "프로젝트 제목", "description": "프로젝트 설명", "goals": ["목표1", "목표2"], "category": "카테고리", "tasks": [{"title": "작업1", "description": "작업 설명"}, ...], "duration": "예상 기간", "benefits": ["이점1", "이점2"]}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error('협업 프로젝트 생성 중 오류 발생:', error);
    return {
      title: '오류가 발생했습니다',
      description: '프로젝트 제안 생성 중 오류가 발생했습니다. 다시 시도해 주세요.',
      goals: [],
      tasks: []
    };
  }
};

/**
 * 데이터 분석 및 통찰 생성 함수
 * @param {Object} data - 분석할 데이터
 * @returns {Object} - 분석 결과
 */
const analyzeData = async (data) => {
  try {
    // 데이터 전처리 및 형식 변환
    const dataString = JSON.stringify(data);
    
    // OpenAI API를 사용하여 데이터 분석
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '당신은 데이터 분석 전문가입니다. 제공된 데이터를 분석하고 중요한 통찰을 추출하세요. 분석 결과를 JSON 형식으로 반환하세요.'
        },
        {
          role: 'user',
          content: `다음 데이터를 분석하고 주요 통찰과 패턴을 찾아주세요:\n\n${dataString}\n\n결과를 JSON 형식으로 반환하세요. 형식: {"insights": ["통찰1", "통찰2"], "patterns": ["패턴1", "패턴2"], "recommendations": ["추천1", "추천2"]}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    logger.error('데이터 분석 중 오류 발생:', error);
    return {
      insights: ['데이터 분석 중 오류가 발생했습니다.'],
      patterns: [],
      recommendations: ['시스템 관리자에게 문의하세요.']
    };
  }
};

module.exports = {
  processMessage,
  analyzeEmotion,
  extractKeywords,
  updateUserProfile,
  findSimilarUsers,
  generateCollaborationProject,
  analyzeData
};
