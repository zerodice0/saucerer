# Saucerer

English | [한국어](README.ko.md)

비용 효율적인 클라우드 인프라로 구축한 소스 레시피 관리 웹 애플리케이션입니다.

## 🏗️ 아키텍처

백엔드와 프론트엔드가 분리된 **모노레포** 프로젝트입니다:

```
saucerer/
├── backend/          # Fastify REST API 서버
│   ├── src/
│   │   ├── routes/   # API 엔드포인트
│   │   ├── config/   # 설정
│   │   ├── utils/    # 유틸리티 (이미지 최적화)
│   │   └── index.ts  # 진입점
│   └── schema.sql    # PostgreSQL 스키마
├── frontend/         # Next.js 15 클라이언트
│   ├── src/
│   │   ├── app/      # App Router 페이지
│   │   ├── components/ # React 컴포넌트
│   │   └── lib/      # API 클라이언트
│   └── package.json
└── package.json      # Workspace 루트
```

## ✨ 주요 기능

- **인증**: Google OAuth2 로그인 + JWT
- **레시피 관리**: 소스 레시피 생성, 수정, 삭제
- **재료 추적**: 정밀한 계량 단위로 재료 관리
- **조리 기록**: 사진, 평점, 메모와 함께 조리 시도 기록
- **이미지 최적화**: 자동 WebP 변환으로 97% 용량 절감
- **비용 효율**: 월 ~$0.15 인프라 비용

## 🚀 기술 스택

### 백엔드
- **프레임워크**: Fastify 5
- **데이터베이스**: Neon PostgreSQL (Serverless)
- **인증**: Google OAuth2 + JWT
- **이미지 스토리지**: Cloudflare R2
- **이미지 처리**: Sharp (WebP 최적화)
- **언어**: TypeScript

### 프론트엔드
- **프레임워크**: Next.js 15 (App Router)
- **스타일링**: TailwindCSS v4
- **아이콘**: Lucide React
- **언어**: TypeScript

## 💰 인프라 비용

| 서비스 | 용도 | 예상 월 비용 |
|--------|------|------------|
| Neon | PostgreSQL 데이터베이스 | $0 (무료 티어) |
| Cloudflare R2 | 이미지 스토리지 | ~$0.15 (10GB) |
| **총계** | | **~$0.15/월** |

## 📦 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd saucerer
npm install
```

### 2. 환경 변수 설정

#### Backend (`backend/.env`)

```bash
# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Cloudflare R2
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=saucerer-images
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. 데이터베이스 설정

Neon에서 데이터베이스를 생성하고 스키마를 적용합니다:

```bash
psql $DATABASE_URL -f backend/schema.sql
```

### 4. Google OAuth2 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services** > **Credentials** 이동
4. **OAuth 2.0 Client ID** 생성
5. 승인된 리디렉션 URI 추가:
   - `http://localhost:3001/auth/google/callback` (개발)
   - `https://your-domain.com/auth/google/callback` (프로덕션)
6. Client ID와 Secret을 `.env`에 추가

### 5. Cloudflare R2 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인
2. **R2** > **Create bucket** 클릭
3. 버킷 이름 입력 (예: `saucerer-images`)
4. `Object Read & Write` 권한으로 **R2 API Token** 생성
5. Account ID, Access Key, Secret Key를 `.env`에 복사
6. 버킷 설정에서 **Public Access** 활성화 (선택사항)

### 6. 개발 서버 실행

```bash
# 모든 서버 실행
npm run dev

# 또는 개별 실행
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

## 🛠️ 개발 명령어

```bash
npm run dev              # 프론트엔드 + 백엔드 실행
npm run dev:frontend     # 프론트엔드만 실행
npm run dev:backend      # 백엔드만 실행
npm run build            # 모두 빌드
npm start                # 프로덕션 서버 시작
```

## 📚 API 엔드포인트

### 인증
```
GET  /auth/google              # Google 로그인 시작
GET  /auth/google/callback     # OAuth 콜백
POST /auth/logout              # 로그아웃
GET  /auth/me                  # 현재 사용자 정보
```

### 소스
```
GET    /api/sauces             # 소스 목록
GET    /api/sauces/:id         # 소스 상세 (재료 포함)
POST   /api/sauces             # 소스 생성
PUT    /api/sauces/:id         # 소스 수정
DELETE /api/sauces/:id         # 소스 삭제
```

### 재료
```
GET    /api/ingredients/sauce/:sauceId  # 재료 목록
POST   /api/ingredients                 # 재료 추가
PUT    /api/ingredients/:id             # 재료 수정
DELETE /api/ingredients/:id             # 재료 삭제
```

### 조리 기록
```
GET    /api/cooking-records/sauce/:sauceId  # 조리 기록 목록
GET    /api/cooking-records/:id             # 조리 기록 상세
POST   /api/cooking-records                 # 조리 기록 생성
PUT    /api/cooking-records/:id             # 조리 기록 수정
DELETE /api/cooking-records/:id             # 조리 기록 삭제
```

### 업로드
```
POST /api/upload/image         # 이미지 업로드 (multipart/form-data)
```

## 📖 데이터베이스 스키마

### users
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `name` (VARCHAR)
- `google_id` (VARCHAR, UNIQUE)
- `created_at`, `updated_at`

### sauces
- `id` (UUID, PK)
- `name` (VARCHAR)
- `user_id` (UUID, FK → users)
- `created_at`, `updated_at`

### ingredients
- `id` (UUID, PK)
- `sauce_id` (UUID, FK → sauces, CASCADE)
- `name` (VARCHAR)
- `amount` (DECIMAL)
- `unit` (VARCHAR, 기본값: '큰술')
- `created_at`

### cooking_records
- `id` (UUID, PK)
- `sauce_id` (UUID, FK → sauces, CASCADE)
- `user_id` (UUID, FK → users, CASCADE)
- `photo_url` (TEXT)
- `notes` (TEXT)
- `rating` (INTEGER, 1-5)
- `ingredient_amounts` (JSONB)
- `created_at`

## 🚢 프로덕션 배포

### 백엔드
```bash
cd backend
npm run build
npm start
```

### 프론트엔드
```bash
cd frontend
npm run build
npm start
```

### 환경 변수 체크리스트
- [ ] `DATABASE_URL` (Neon 연결 문자열)
- [ ] `JWT_SECRET` (랜덤 문자열)
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- [ ] `R2_*` (Cloudflare R2 자격증명)
- [ ] `OAUTH_CALLBACK_URL` (프로덕션 URL)
- [ ] `FRONTEND_URL` (프로덕션 URL)

## 📝 라이선스

MIT License

---

Fastify, Next.js, 그리고 현대적인 클라우드 인프라로 만들었습니다 ❤️
