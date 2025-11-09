-- Saucerer Database Schema for PostgreSQL (Neon)
-- 독립 인증 시스템 (Google OAuth2 + JWT)

-- Users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sauces 테이블 생성
CREATE TABLE IF NOT EXISTS sauces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ingredients 테이블 생성
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sauce_id UUID REFERENCES sauces(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(5,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT '큰술',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Cooking Records 테이블 생성
CREATE TABLE IF NOT EXISTS cooking_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sauce_id UUID REFERENCES sauces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  ingredient_amounts JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_google_id_idx ON users(google_id);
CREATE INDEX IF NOT EXISTS sauces_user_id_idx ON sauces(user_id);
CREATE INDEX IF NOT EXISTS ingredients_sauce_id_idx ON ingredients(sauce_id);
CREATE INDEX IF NOT EXISTS cooking_records_sauce_id_idx ON cooking_records(sauce_id);
CREATE INDEX IF NOT EXISTS cooking_records_user_id_idx ON cooking_records(user_id);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sauces_updated_at ON sauces;
CREATE TRIGGER update_sauces_updated_at
    BEFORE UPDATE ON sauces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE users IS '사용자 정보 (Google OAuth2)';
COMMENT ON TABLE sauces IS '소스 레시피';
COMMENT ON TABLE ingredients IS '소스 재료';
COMMENT ON TABLE cooking_records IS '조리 기록 (사진, 별점, 메모, 배합 정보)';
