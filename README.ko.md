# Saucerer

English | [한국어](README.ko.md)

소스 레시피를 관리하고 요리 기록을 남길 수 있는 웹 애플리케이션입니다.

## 기능

- 소스 레시피 생성, 수정, 삭제
- 재료 관리 (이름, 양, 단위)
- 요리 기록 추가 (사진, 메모, 평점, 실제 재료 분량)
- 사용자별 데이터 관리 (인증 필요)

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **스타일링**: TailwindCSS v4
- **아이콘**: Lucide React
- **언어**: TypeScript

## 환경 설정

1. 프로젝트 클론 및 의존성 설치:
```bash
git clone <repository-url>
cd saucerer
npm install
```

2. 환경 변수 설정:
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. 개발 서버 실행:
```bash
npm run dev --turbopack
```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 개발 명령어

- `npm run dev --turbopack` - 개발 서버 실행 (Turbo 사용)
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 실행

## 데이터베이스 구조

### 테이블

1. **sauces** - 소스 레시피
   - `id`, `name`, `user_id`, `created_at`, `updated_at`

2. **ingredients** - 재료
   - `id`, `sauce_id`, `name`, `amount`, `unit`, `created_at`

3. **cooking_records** - 요리 기록
   - `id`, `sauce_id`, `user_id`, `photo_url`, `notes`, `rating`, `ingredient_amounts` (JSONB), `created_at`

모든 테이블은 Row Level Security (RLS)를 통해 사용자별로 데이터가 격리됩니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 로그인 페이지 (홈)
│   ├── layout.tsx         # 루트 레이아웃
│   └── sauces/            # 소스 관련 페이지
│       ├── page.tsx       # 소스 목록
│       ├── new/           # 새 소스 생성
│       └── [id]/          # 개별 소스 페이지
│           ├── page.tsx   # 소스 상세/편집
│           └── records/   # 요리 기록
├── components/            # 재사용 가능한 컴포넌트
│   ├── LoginForm.tsx     # 로그인 폼
│   └── ui/               # UI 컴포넌트
└── lib/
    └── supabase.ts       # Supabase 클라이언트 설정
```

## 사용법

1. 회원가입 또는 로그인
2. 소스 레시피 생성
3. 재료 추가/편집
4. 요리 후 기록 추가 (사진, 메모, 평점 등)

## 배포

Vercel에 배포하는 것을 권장합니다:

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 완료