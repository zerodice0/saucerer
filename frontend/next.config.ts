import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 호환성 설정
  output: 'standalone',

  // 이미지 최적화 설정
  images: {
    unoptimized: true, // Cloudflare Pages는 자체 이미지 최적화 사용
  },
};

export default nextConfig;
