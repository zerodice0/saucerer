import { FastifyInstance } from 'fastify';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '../config/r2.js';
import { optimizeImage, createThumbnail } from '../utils/image-optimizer.js';
import { authenticate } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

export async function setupUpload(fastify: FastifyInstance) {
  // 이미지 업로드
  fastify.post('/image', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: '파일이 업로드되지 않았습니다.' });
      }

      // MIME 타입 검증
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          error: '지원되지 않는 파일 형식입니다. JPEG, PNG, WebP만 허용됩니다.',
        });
      }

      // 파일 읽기
      const buffer = await data.toBuffer();

      // 파일 크기 검증 (10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        return reply.code(400).send({
          error: '파일 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.',
        });
      }

      // 이미지 최적화
      const optimizedBuffer = await optimizeImage(buffer, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 80,
        format: 'webp',
      });

      // 썸네일 생성
      const thumbnailBuffer = await createThumbnail(buffer, 300);

      // 고유 파일명 생성
      const fileId = randomUUID();
      const fileName = `${fileId}.webp`;
      const thumbnailName = `${fileId}_thumb.webp`;

      // R2에 업로드
      const uploadCommands = [
        // 원본 (최적화된 이미지)
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: `images/${fileName}`,
          Body: optimizedBuffer,
          ContentType: 'image/webp',
        }),
        // 썸네일
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: `thumbnails/${thumbnailName}`,
          Body: thumbnailBuffer,
          ContentType: 'image/webp',
        }),
      ];

      await Promise.all(uploadCommands.map(cmd => r2Client.send(cmd)));

      // 공개 URL 반환
      const imageUrl = `${R2_PUBLIC_URL}/images/${fileName}`;
      const thumbnailUrl = `${R2_PUBLIC_URL}/thumbnails/${thumbnailName}`;

      fastify.log.info(`이미지 업로드 성공: ${fileName}`);

      return {
        success: true,
        url: imageUrl,
        thumbnailUrl,
        originalSize: buffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: ((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(2) + '%',
      };
    } catch (err) {
      fastify.log.error('이미지 업로드 실패:', err);
      return reply.code(500).send({ error: '이미지 업로드 중 오류가 발생했습니다.' });
    }
  });
}
