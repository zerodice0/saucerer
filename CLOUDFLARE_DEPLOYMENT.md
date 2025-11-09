# Cloudflare 하이브리드 배포 가이드

Saucerer를 Cloudflare Workers + Pages로 배포하는 완전한 가이드입니다.

## 📋 아키텍처

```
Frontend: Cloudflare Pages (Next.js)
Backend: Cloudflare Workers (Hono)
Database: Neon PostgreSQL (현재 유지)
Storage: Cloudflare R2 (현재 유지)
```

## 🎯 배포 비용

- **초기 (무료 플랜)**: $0/월
- **규모 확장 시**: $5/월 (Workers Paid 플랜)

자세한 비용 분석은 프로젝트 루트의 문서를 참조하세요.

---

## 🚀 1단계: 백엔드 배포 (Cloudflare Workers)

### 1-1. Cloudflare 계정 설정

1. [Cloudflare 대시보드](https://dash.cloudflare.com) 가입/로그인
2. Workers & Pages 섹션으로 이동

### 1-2. R2 버킷 확인/생성

1. R2 섹션으로 이동
2. 기존 `saucerer-images` 버킷 확인 또는 새로 생성
3. 공개 액세스 설정:
   - Settings → Public Access
   - Custom Domain 또는 R2.dev 서브도메인 활성화
   - 공개 URL 복사 (예: `https://pub-xxxxx.r2.dev`)

### 1-3. 백엔드 프로젝트 준비

```bash
cd backend-workers
npm install
```

### 1-4. 환경 변수 설정 (Secrets)

Cloudflare Workers에 Secrets를 설정합니다:

```bash
# Wrangler CLI 로그인
npx wrangler login

# Secrets 설정
npx wrangler secret put DATABASE_URL
# 입력: postgresql://user:password@host/database?sslmode=require

npx wrangler secret put JWT_SECRET
# 입력: 강력한 랜덤 문자열 (예: openssl rand -base64 32)

npx wrangler secret put GOOGLE_CLIENT_ID
# 입력: Google OAuth2 클라이언트 ID

npx wrangler secret put GOOGLE_CLIENT_SECRET
# 입력: Google OAuth2 클라이언트 시크릿

npx wrangler secret put R2_PUBLIC_URL
# 입력: R2 버킷 공개 URL (예: https://pub-xxxxx.r2.dev)

npx wrangler secret put FRONTEND_URL
# 입력: 일단 임시로 http://localhost:3000 (나중에 업데이트)
```

### 1-5. wrangler.toml 확인

`backend-workers/wrangler.toml` 파일에서 R2 바인딩 확인:

```toml
[[r2_buckets]]
binding = "IMAGES_BUCKET"
bucket_name = "saucerer-images"  # 실제 버킷 이름으로 변경
```

### 1-6. 백엔드 배포

```bash
npm run deploy
```

배포 성공 시 Workers URL이 표시됩니다:
```
https://saucerer-backend.your-subdomain.workers.dev
```

**이 URL을 복사해두세요!** (Frontend 설정에 필요)

### 1-7. 배포 확인

```bash
curl https://saucerer-backend.your-subdomain.workers.dev/health
```

응답 예시:
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T...",
  "service": "saucerer-backend-workers"
}
```

---

## 🎨 2단계: 프론트엔드 배포 (Cloudflare Pages)

### 2-1. 프론트엔드 프로젝트 준비

```bash
cd frontend
npm install
```

### 2-2. 환경 변수 설정

**로컬 개발용** (`.env.local` 생성):
```bash
NEXT_PUBLIC_API_URL=https://saucerer-backend.your-subdomain.workers.dev
```

**프로덕션용** (Cloudflare Pages 대시보드에서 설정):
- 나중에 Pages 생성 후 설정

### 2-3. 빌드 테스트

```bash
npm run pages:build
```

성공하면 `.vercel/output/static` 디렉토리가 생성됩니다.

### 2-4. Cloudflare Pages 프로젝트 생성 (옵션 1: CLI)

```bash
npx wrangler pages deploy .vercel/output/static --project-name=saucerer-frontend
```

첫 배포 시 프로젝트가 자동 생성됩니다.

### 2-5. Cloudflare Pages 프로젝트 생성 (옵션 2: GitHub 연동)

1. Cloudflare Dashboard → Pages → Create a project
2. Connect to Git → GitHub 저장소 선택
3. Build settings:
   - **Framework preset**: Next.js
   - **Build command**: `cd frontend && npm install && npm run pages:build`
   - **Build output directory**: `frontend/.vercel/output/static`
   - **Root directory**: `/`
4. Environment variables 추가:
   - `NEXT_PUBLIC_API_URL`: `https://saucerer-backend.your-subdomain.workers.dev`
5. Save and Deploy

### 2-6. 배포 확인

배포 완료 후 Pages URL이 표시됩니다:
```
https://saucerer-frontend.pages.dev
```

브라우저에서 접속하여 확인합니다.

---

## 🔄 3단계: OAuth 콜백 URL 업데이트

### 3-1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com) 로그인
2. OAuth 2.0 클라이언트 ID 선택
3. **승인된 리디렉션 URI**에 추가:
   ```
   https://saucerer-backend.your-subdomain.workers.dev/auth/google/callback
   ```
4. 저장

### 3-2. Workers 환경 변수 업데이트

Frontend URL을 실제 Pages URL로 업데이트:

```bash
cd backend-workers
npx wrangler secret put FRONTEND_URL
# 입력: https://saucerer-frontend.pages.dev
```

### 3-3. Workers 재배포

```bash
npm run deploy
```

---

## ✅ 4단계: 전체 테스트

### 4-1. 로그인 테스트

1. `https://saucerer-frontend.pages.dev` 접속
2. Google 로그인 클릭
3. OAuth 인증 진행
4. `/sauces` 페이지로 리다이렉트 확인

### 4-2. CRUD 작업 테스트

- 소스 생성
- 재료 추가
- 조리 기록 작성
- 이미지 업로드

### 4-3. 로그 확인

실시간 로그 확인:

```bash
cd backend-workers
npm run tail
```

---

## 🎛️ 5단계: 커스텀 도메인 설정 (선택사항)

### 5-1. Workers 커스텀 도메인

1. Cloudflare Dashboard → Workers → saucerer-backend
2. Settings → Triggers → Custom Domains
3. Add Custom Domain → 예: `api.yourdomain.com`
4. DNS가 자동으로 설정됩니다

### 5-2. Pages 커스텀 도메인

1. Cloudflare Dashboard → Pages → saucerer-frontend
2. Custom domains → Add a custom domain
3. 예: `app.yourdomain.com` 또는 `yourdomain.com`
4. DNS가 자동으로 설정됩니다

### 5-3. 환경 변수 업데이트

커스텀 도메인 사용 시:

**Workers**:
```bash
npx wrangler secret put FRONTEND_URL
# 입력: https://app.yourdomain.com
```

**Pages** (대시보드에서 환경 변수 수정):
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**Google OAuth**:
리디렉션 URI 업데이트:
```
https://api.yourdomain.com/auth/google/callback
```

---

## 🔧 로컬 개발 환경

### 백엔드 (Workers)

```bash
cd backend-workers
cp .dev.vars.example .dev.vars
# .dev.vars 파일 수정 (실제 값 입력)

npm install
npm run dev
# http://localhost:8787
```

### 프론트엔드 (Next.js)

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8787

npm install
npm run dev
# http://localhost:3000
```

---

## 📊 배포 후 모니터링

### Workers 대시보드

- CPU 사용량
- 요청 수
- 에러율
- 레이턴시

### R2 대시보드

- 저장 용량
- 작업 수
- 대역폭 (무료)

### Neon 대시보드

- 컴퓨트 시간
- 저장 용량
- 연결 수

---

## 🚨 문제 해결

### 1. OAuth 콜백 실패

**증상**: "redirect_uri_mismatch" 에러

**해결**:
- Google Cloud Console에서 리디렉션 URI 확인
- Workers URL이 정확한지 확인
- HTTPS 사용 확인

### 2. CORS 에러

**증상**: Frontend에서 API 호출 실패

**해결**:
- Workers의 `FRONTEND_URL` 환경 변수 확인
- `backend-workers/src/index.ts`의 CORS 설정 확인

### 3. 이미지 업로드 실패

**증상**: 이미지 업로드 시 500 에러

**해결**:
- R2 버킷 바인딩 확인 (`wrangler.toml`)
- R2 버킷이 실제로 존재하는지 확인
- R2 공개 URL 환경 변수 확인

### 4. 데이터베이스 연결 실패

**증상**: API 호출 시 데이터베이스 에러

**해결**:
- Neon DATABASE_URL 확인
- Neon 대시보드에서 활성 상태 확인
- `?sslmode=require` 파라미터 포함 확인

---

## 💰 비용 최적화 팁

1. **Workers 무료 한도 활용**:
   - 100,000 요청/일까지 무료
   - 소규모 앱은 무료 플랜으로 충분

2. **R2 무료 한도**:
   - 10GB 저장 무료
   - 이미지를 클라이언트에서 리사이징하여 업로드 크기 최소화

3. **Neon 무료 플랜**:
   - 0.5GB 스토리지 무료
   - 오래된 데이터 정기적으로 정리

4. **캐싱 활용**:
   - Cloudflare CDN 자동 캐싱
   - 정적 에셋은 자동으로 엣지에 캐시됨

---

## 🔄 CI/CD 설정 (선택사항)

### GitHub Actions

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy-workers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Deploy Workers
        working-directory: backend-workers
        run: |
          npm install
          npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-pages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Build and Deploy Pages
        working-directory: frontend
        run: |
          npm install
          npm run pages:build
          npx wrangler pages deploy .vercel/output/static --project-name=saucerer-frontend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**GitHub Secrets 설정**:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API 토큰 (대시보드에서 생성)

---

## 📚 추가 리소스

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)
- [Hono 문서](https://hono.dev/)
- [Neon 문서](https://neon.tech/docs)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)

---

## 🎉 완료!

축하합니다! Saucerer가 Cloudflare에 성공적으로 배포되었습니다.

**배포된 URL**:
- Frontend: `https://saucerer-frontend.pages.dev`
- Backend: `https://saucerer-backend.your-subdomain.workers.dev`

**비용**: $0/월 (무료 플랜)

질문이나 문제가 있으면 Issues를 통해 문의해주세요.
