# VirtualSphere

<div align="center">
  <img src="https://raw.githubusercontent.com/JJshome/virtual-sphere/main/assets/virtual-sphere-logo.svg" width="700" alt="VirtualSphere Patent Technology Visualization">
</div>

## 🔬 특허 기반 LLM 가상 소셜 네트워크 시스템

VirtualSphere는 **Ucaretron Inc.**가 개발한 혁신적인 특허 기술을 기반으로 하는 차세대 가상 소셜 네트워크 플랫폼입니다. 이 시스템은 개인별 LLM 인스턴스, 자율적 가상 휴먼 에이전트, 집단 상상력 기반 동적 세계 생성 등의 핵심 특허 기술을 구현합니다.

> **⚖️ 특허 보호 기술**: 본 시스템의 핵심 기술들은 Ucaretron Inc.의 특허권으로 보호받고 있습니다. 
> - **기술 분야**: LLM 기반 가상 소셜 네트워크, 가상 휴먼 에이전트, 집단 상상력 동적 세계

## 🚀 핵심 특허 기술

### 1. 개인별 LLM 인스턴스 시스템 
- **기술적 혁신**: 각 사용자마다 완전히 개인화된 LLM 인스턴스 생성
- **특허 포인트**: 사용자 성향, 감정 패턴, 학습 이력을 반영한 동적 LLM 개인화
- **표준화**: LLM Instance Protocol (LIP) 구현

```javascript
// 개인별 LLM 인스턴스 생성 예시
const personalLLM = await LLMOrchestrator.createPersonalLLMInstance(userId, {
  creativity: 0.8,
  empathy: 0.9, 
  analyticalThinking: 0.7,
  personalityTraits: userProfile.emotionalProfile
});
```

### 2. 자율적 가상 휴먼 에이전트 
- **기술적 혁신**: 사용자를 대신하여 자율적으로 활동하는 지능형 가상 휴먼
- **특허 포인트**: 사용자 부재 시에도 지속적인 소셜 활동 및 학습 수행
- **표준화**: Virtual Human Agent Protocol (VHAP) 구현

```javascript
// 가상 휴먼 자율 행동 시스템
const virtualHuman = await VirtualHumanService.createVirtualHuman(userId, {
  autonomyLevel: 0.8,
  canInitiateConversations: true,
  canJoinCollaborations: true,
  evolutionParameters: { learningRate: 0.1, adaptationThreshold: 0.6 }
});
```

### 3. 집단 상상력 기반 동적 세계 생성 
- **기술적 혁신**: 사용자들의 집단 상상력을 실시간으로 가상 세계에 반영
- **특허 포인트**: 다중 센서 융합 및 감정 인식을 통한 동적 환경 변화
- **표준화**: Dynamic World State Protocol (DWSP) 구현

### 4. 실시간 감정/상황 인식 시스템 
- **기술적 혁신**: 사용자의 감정과 상황을 실시간 분석하여 맞춤형 반응 제공  
- **특허 포인트**: CNN-LSTM 하이브리드 모델을 통한 다중 모달 감정 분석
- **표준화**: Emotion Analysis Standard (EAS) 구현

### 5. 블록체인 기반 가상 경제 시스템
- **기술적 혁신**: 협업 성과를 NFT로 보상하는 탈중앙화 경제 시스템
- **특허 포인트**: 가상 자산의 실제 경제적 가치 연동 메커니즘
- **표준화**: Virtual Asset Standard (VAS) 구현

## 📋 시스템 아키텍처

<div align="center">
  <img src="https://raw.githubusercontent.com/JJshome/virtual-sphere/main/assets/virtualsphere-architecture.svg" width="800" alt="VirtualSphere Patent Architecture Diagram">
</div>

## 🛠️ 기술 스택

### Backend
- **Node.js + Express.js**: 고성능 API 서버
- **MongoDB**: 사용자 및 LLM 인스턴스 데이터
- **Redis**: 실시간 캐싱 및 세션 관리
- **OpenAI GPT-4**: 개인별 LLM 인스턴스 기반
- **TensorFlow.js**: 감정 분석 및 패턴 인식
- **Socket.IO**: 실시간 가상 휴먼 상호작용
- **Web3.js**: 블록체인 통합 및 NFT 관리

### Frontend
- **Next.js + React**: 현대적 웹 애플리케이션
- **Material-UI**: 세련된 사용자 인터페이스
- **Three.js**: 3D 가상 휴먼 렌더링
- **Recharts**: 데이터 시각화 및 분석
- **Framer Motion**: 인터랙티브 애니메이션

### DevOps & Infrastructure
- **Docker + Docker Compose**: 컨테이너화된 배포
- **Nginx**: 리버스 프록시 및 로드 밸런싱
- **Winston**: 구조화된 로깅 시스템
- **Jest**: 테스트 자동화

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18+ 
- Docker & Docker Compose
- OpenAI API Key
- MongoDB & Redis (Docker로 자동 설치됨)

### 1. 프로젝트 클론
```bash
git clone https://github.com/JJshome/virtual-sphere.git
cd virtual-sphere
```

### 2. 환경 변수 설정
```bash
# Backend 환경 변수 복사 및 설정
cp backend/.env.example backend/.env

# 필수 환경 변수 설정
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_super_secret_jwt_key
MONGODB_URI=mongodb://admin:virtualsphere2024@mongodb:27017/virtualsphere?authSource=admin
REDIS_URL=redis://:virtualsphere2024@redis:6379
```

### 3. 개발 환경 실행
```bash
# 전체 개발 환경 설정 (권장)
npm run setup:dev

# 또는 단계별 실행
npm run install:all
npm run docker:dev
```

### 4. 서비스 접속
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API 문서**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## 📖 특허 기술 문서

### API 표준화
```
/api/v1/
├── users/              # 사용자 관리 (UPS 표준)
├── llm/                # 개인별 LLM 인스턴스 (LIP 표준)  
├── virtual-humans/     # 가상 휴먼 관리 (VHAP 표준)
├── worlds/             # 동적 세계 관리 (DWSP 표준)
├── emotions/           # 감정 분석 (EAS 표준)
├── collaborations/     # 협업 프로젝트
├── assets/             # 가상 자산 (VAS 표준)
└── rewards/            # 보상 시스템
```

### WebSocket 이벤트 표준
```javascript
// 특허 기반 실시간 이벤트
vs:user:connect         // 사용자 연결
vs:llm:query           // 개인 LLM 쿼리
vs:vh:action           // 가상 휴먼 자율 행동
vs:world:update        // 집단 상상력 세계 업데이트
vs:emotion:change      // 실시간 감정 상태 변화
vs:collab:invite       // 협업 초대
vs:asset:trade         // 블록체인 자산 거래
```

## 🧪 개발 및 테스트

### 개발 서버 실행
```bash
# 전체 개발 환경
npm run dev

# 개별 서비스
npm run dev:backend    # Backend만
npm run dev:frontend   # Frontend만
```

### 테스트 실행
```bash
npm run test           # 전체 테스트
npm run test:backend   # Backend 테스트
npm run test:frontend  # Frontend 테스트
```

### 코드 품질 검사
```bash
npm run lint           # ESLint 실행
npm run lint:fix       # 자동 수정
```

## 📊 성능 및 모니터링

### 시스템 헬스체크
```bash
npm run health            # 전체 서비스 상태 확인
curl http://localhost:5000/health  # API 서버 상태
```

### 모니터링 대시보드
- **실시간 LLM 인스턴스 현황**: /api/v1/llm/status
- **가상 휴먼 활동 모니터링**: /api/v1/virtual-humans/activity
- **시스템 성능 메트릭**: /api/v1/system/metrics

## 🔒 보안 및 개인정보 보호

- **데이터 암호화**: AES-256 암호화 적용
- **API 보안**: JWT 토큰 기반 인증
- **개인정보 보호**: GDPR 준수 데이터 처리
- **블록체인 보안**: 멀티시그 지갑 및 스마트 컨트랙트 감사

### 특허 기술 표준 준수 가이드라인
- UPS (User Profile Standard) 준수
- LIP (LLM Instance Protocol) 표준 구현
- VHAP (Virtual Human Agent Protocol) 준수
- DWSP (Dynamic World State Protocol) 구현
- EAS (Emotion Analysis Standard) 준수
- VAS (Virtual Asset Standard) 표준 적용

### 특허 기술
핵심 특허 기술들은 Ucaretron Inc.의 지적재산권입니다.:

- **개인별 LLM 인스턴스 시스템**
- **자율적 가상 휴먼 에이전트 기술**  
- **집단 상상력 기반 동적 세계 생성**
- **실시간 감정/상황 인식 엔진**
- **블록체인 기반 가상 경제 시스템**

---

<div align="center">
  <h3>🔬 VirtualSphere - 차세대 가상 소셜 네트워크</h3>
  <p><strong>Powered by Ucaretron Inc. Patent Technology</strong></p>
  <p>🏆 <em>업계 표준을 재정의하는 혁신적인 AI 기술</em></p>
</div>
