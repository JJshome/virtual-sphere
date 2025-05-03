# VirtualSphere

## LLM 기반 가상 소셜 네트워크 시스템

VirtualSphere는 LLM(Large Language Model)을 활용한 혁신적인 가상 소셜 네트워크 시스템입니다. 이 시스템은 기존 SNS의 한계를 넘어서 현실과의 상호작용, 몰입감, 개인화 및 맞춤형 상호작용을 제공합니다.

## 주요 기능

1. **LLM 기반 가상 휴먼 생성 및 활용**
   - 사용자 맞춤형 가상 휴먼 생성
   - 대리 상호작용 및 멀티태스킹 지원

2. **지능형 사용자 매칭 및 네트워크 형성**
   - 데이터 기반 자동 매칭 시스템
   - 관심사 및 목표 기반 협업 파트너 추천

3. **협업 중심의 가상 환경 제공**
   - 자동화된 협업 프로젝트 생성
   - 실시간 데이터 분석 및 문제 해결 지원

4. **감정 및 상황 인식 기반 맞춤형 상호작용**
   - 실시간 사용자 감정/상황 분석
   - 개인화된 대응 및 활동 제안

5. **블록체인 및 NFT 기반 가상 경제 시스템**
   - 활동 기반 가상 자산 획득
   - 블록체인 기반 거래 및 보상 시스템

## 기술 스택

- **백엔드**: Node.js, Express.js, MongoDB
- **프론트엔드**: React.js, Next.js, Material-UI
- **LLM 모델**: OpenAI API (GPT-4)
- **블록체인**: Ethereum, Web3.js
- **배포**: Docker, Nginx, AWS/Vercel

## 프로젝트 구조

```
VirtualSphere/
├── backend/             # 백엔드 코드
│   ├── src/
│   │   ├── controllers/   # API 컨트롤러
│   │   ├── models/        # 데이터베이스 모델
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직 서비스
│   │   ├── socket/        # 소켓 통신 처리
│   │   ├── middlewares/   # Express 미들웨어
│   │   └── utils/         # 유틸리티 함수
│   ├── Dockerfile       # 백엔드 도커파일
│   └── package.json
├── frontend/            # 프론트엔드 코드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── contexts/      # React 컨텍스트
│   │   ├── pages/         # Next.js 페이지
│   │   ├── services/      # API 통신 서비스
│   │   ├── styles/        # CSS 및 스타일
│   │   └── utils/         # 유틸리티 함수
│   ├── Dockerfile       # 프론트엔드 도커파일
│   └── package.json
├── nginx/               # 웹서버 설정
├── docker-compose.yml    # 개발용 도커 컴포즈
├── docker-compose.prod.yml # 운영용 도커 컴포즈
└── README.md
```

## 설치 방법

### 개발 환경 설정

1. 저장소를 클론합니다.
   ```bash
   git clone https://github.com/JJshome/virtual-sphere.git
   cd virtual-sphere
   ```

2. 환경 변수 파일을 설정합니다.
   ```bash
   cp backend/.env.example backend/.env
   # .env 파일에 필요한 환경 변수 입력
   ```

3. 의존성을 설치합니다.
   ```bash
   npm run install:all
   ```

4. 개발 서버를 실행합니다.
   ```bash
   npm run dev
   ```

### 도커를 통한 개발 환경 설정

```bash
# 도커 컴포즈로 개발 환경 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 운영 환경 배포

1. 환경 변수 설정 및 SSL 인증서 준비

   ```bash
   # 운영 환경 변수 설정
   export JWT_SECRET=your_jwt_secret
   export OPENAI_API_KEY=your_openai_api_key
   export ETHEREUM_NODE_URL=your_ethereum_node_url

   # SSL 인증서 준비
   mkdir -p nginx/ssl
   # SSL 인증서 파일을 nginx/ssl/ 디렉토리에 복사
   ```

2. 도커 컴포즈를 사용하여 배포

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. 배포 확인

   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

## API 문서

API 문서는 백엔드 서버 실행 후 다음 URL에서 확인할 수 있습니다:
- 개발 환경: `http://localhost:5000/api-docs`
- 운영 환경: `https://api.virtualsphere.example.com/api-docs`

## 기여하기

1. 이 저장소를 포크합니다.
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 연락처

프로젝트 관리자 - [@JJshome](https://github.com/JJshome)

프로젝트 링크: [https://github.com/JJshome/virtual-sphere](https://github.com/JJshome/virtual-sphere)
