import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import type { Env } from '../types/env';

const upload = new Hono<{ Bindings: Env }>();

/**
 * 이미지 업로드
 *
 * 참고: Cloudflare Workers에서는 Sharp를 사용할 수 없으므로,
 * 이미지 최적화는 클라이언트 측에서 처리하거나
 * Cloudflare Images API를 사용해야 합니다.
 *
 * 현재 구현: R2에 직접 업로드 (원본 그대로)
 * 썸네일: Cloudflare의 이미지 변환 URL 사용 (예: /?width=300)
 */
upload.post('/image', authenticate, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: '파일이 업로드되지 않았습니다.' }, 400);
    }

    // MIME 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({
        error: '지원되지 않는 파일 형식입니다. JPEG, PNG, WebP만 허용됩니다.',
      }, 400);
    }

    // 파일 크기 검증 (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return c.json({
        error: '파일 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.',
      }, 400);
    }

    // 파일 읽기
    const buffer = await file.arrayBuffer();

    // 고유 파일명 생성
    const fileId = crypto.randomUUID();
    const extension = file.type.split('/')[1];
    const fileName = `${fileId}.${extension}`;

    // R2에 업로드
    await c.env.IMAGES_BUCKET.put(`images/${fileName}`, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 공개 URL 생성
    const imageUrl = `${c.env.R2_PUBLIC_URL}/images/${fileName}`;

    // 썸네일 URL (Cloudflare Image Resizing 사용 시)
    // 참고: R2 커스텀 도메인에 Cloudflare Image Resizing을 활성화해야 함
    const thumbnailUrl = `${imageUrl}?width=300&height=300&fit=cover`;

    console.log(`이미지 업로드 성공: ${fileName}`);

    return c.json({
      success: true,
      url: imageUrl,
      thumbnailUrl,
      originalSize: file.size,
      optimizedSize: buffer.byteLength,
      compressionRatio: '0%', // 압축 없음 (클라이언트 측에서 처리 권장)
    });
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return c.json({ error: '이미지 업로드 중 오류가 발생했습니다.' }, 500);
  }
});

export default upload;
