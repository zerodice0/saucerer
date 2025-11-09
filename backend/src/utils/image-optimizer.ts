import sharp from 'sharp';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 80,
  format: 'webp',
};

/**
 * 이미지를 최적화합니다.
 * - 해상도 제한
 * - WebP 포맷 변환
 * - 품질 압축
 *
 * @param buffer 원본 이미지 버퍼
 * @param options 최적화 옵션
 * @returns 최적화된 이미지 버퍼
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let image = sharp(buffer);

  // 메타데이터 가져오기
  const metadata = await image.metadata();

  // 해상도 조정 (비율 유지)
  if (metadata.width && metadata.height) {
    if (metadata.width > opts.maxWidth || metadata.height > opts.maxHeight) {
      image = image.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  // 포맷 변환 및 압축
  switch (opts.format) {
    case 'webp':
      image = image.webp({ quality: opts.quality });
      break;
    case 'jpeg':
      image = image.jpeg({ quality: opts.quality, mozjpeg: true });
      break;
    case 'png':
      image = image.png({ quality: opts.quality, compressionLevel: 8 });
      break;
  }

  return image.toBuffer();
}

/**
 * 이미지 썸네일을 생성합니다.
 *
 * @param buffer 원본 이미지 버퍼
 * @param size 썸네일 크기 (정사각형)
 * @returns 썸네일 이미지 버퍼
 */
export async function createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 75 })
    .toBuffer();
}

/**
 * 이미지 정보를 가져옵니다.
 */
export async function getImageInfo(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: buffer.length,
  };
}
