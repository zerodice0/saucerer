# Saucerer Backend - Cloudflare Workers

Cloudflare Workers로 구현된 Saucerer 백엔드 API입니다.

## 기술 스택

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Neon PostgreSQL (@neondatabase/serverless)
- **Auth**: JWT (jose)
- **Storage**: Cloudflare R2

## 로컬 개발

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.dev.vars.example`을 복사하여 `.dev.vars` 생성:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` 파일에 실제 값 입력:
- `DATABASE_URL`: Neon PostgreSQL 연결 문자열
- `JWT_SECRET`: JWT 서명 시크릿
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth2 인증 정보
- `R2_PUBLIC_URL`: Cloudflare R2 버킷 공개 URL
- `FRONTEND_URL`: 프론트엔드 URL

### 3. R2 버킷 생성

Cloudflare Dashboard에서 R2 버킷 생성:
- 버킷 이름: `saucerer-images`
- 공개 액세스 설정

### 4. 로컬 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:8787`에서 실행됩니다.

## 배포

### 1. Secrets 설정

```bash
# JWT 시크릿
wrangler secret put JWT_SECRET

# 데이터베이스 URL
wrangler secret put DATABASE_URL

# Google OAuth2
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# R2 공개 URL
wrangler secret put R2_PUBLIC_URL

# 프론트엔드 URL
wrangler secret put FRONTEND_URL
```

### 2. R2 버킷 바인딩 확인

`wrangler.toml`의 R2 바인딩이 올바른지 확인:

```toml
[[r2_buckets]]
binding = "IMAGES_BUCKET"
bucket_name = "saucerer-images"
```

### 3. 배포 실행

```bash
npm run deploy
```

배포 후 Workers URL이 표시됩니다 (예: `https://saucerer-backend.your-subdomain.workers.dev`).

### 4. 커스텀 도메인 설정 (선택사항)

Cloudflare Dashboard에서 Workers에 커스텀 도메인 연결 가능합니다.

## API 엔드포인트

### 인증
- `GET /auth/google` - Google OAuth2 로그인 시작
- `GET /auth/google/callback` - OAuth2 콜백
- `POST /auth/logout` - 로그아웃
- `GET /auth/me` - 현재 사용자 정보

### 소스
- `GET /api/sauces` - 소스 목록
- `GET /api/sauces/:id` - 소스 상세
- `POST /api/sauces` - 소스 생성
- `PUT /api/sauces/:id` - 소스 수정
- `DELETE /api/sauces/:id` - 소스 삭제

### 재료
- `GET /api/ingredients/sauce/:sauceId` - 재료 목록
- `POST /api/ingredients` - 재료 생성
- `PUT /api/ingredients/:id` - 재료 수정
- `DELETE /api/ingredients/:id` - 재료 삭제

### 조리 기록
- `GET /api/cooking-records/sauce/:sauceId` - 조리 기록 목록
- `GET /api/cooking-records/:id` - 조리 기록 상세
- `POST /api/cooking-records` - 조리 기록 생성
- `PUT /api/cooking-records/:id` - 조리 기록 수정
- `DELETE /api/cooking-records/:id` - 조리 기록 삭제

### 업로드
- `POST /api/upload/image` - 이미지 업로드

### 헬스체크
- `GET /health` - 서버 상태 확인

## 주요 차이점 (기존 Fastify 백엔드 대비)

1. **이미지 최적화**: Sharp 대신 클라이언트 측 리사이징 권장
2. **OAuth2**: 플러그인 대신 수동 구현
3. **DB 연결**: `postgres` 대신 `@neondatabase/serverless` 사용
4. **JWT**: `@fastify/jwt` 대신 `jose` 라이브러리 사용
5. **성능**: 전 세계 300+ 엣지 위치에서 실행

## 로그 확인

실시간 로그 확인:

```bash
npm run tail
```

## 비용

- **Workers**: 100,000 요청/일 무료, 초과 시 $0.30/100만 요청
- **R2**: 10GB 저장 무료, 100만 작업 무료
- **Neon**: 별도 (0.5GB 무료)

예상 비용: **$0/월** (소규모 사용 시)
