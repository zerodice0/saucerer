import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { CookingRecord, Sauce } from '../types/database.js';

export async function setupCookingRecords(fastify: FastifyInstance) {
  // 모든 라우트에 인증 필요
  fastify.addHook('onRequest', authenticate);

  // 조리 기록 목록 조회 (특정 소스)
  fastify.get('/sauce/:sauceId', async (request, reply) => {
    const { sauceId } = request.params as { sauceId: string };
    const userId = request.user!.userId;
    const { limit } = request.query as { limit?: string };

    // 소스 소유권 확인
    const [sauce] = await fastify.sql<Sauce[]>`
      SELECT id FROM sauces
      WHERE id = ${sauceId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!sauce) {
      return reply.code(404).send({ error: '소스를 찾을 수 없습니다.' });
    }

    let query = fastify.sql<CookingRecord[]>`
      SELECT * FROM cooking_records
      WHERE sauce_id = ${sauceId} AND user_id = ${userId}
      ORDER BY created_at DESC
    `;

    if (limit) {
      const limitNum = parseInt(limit, 10);
      query = fastify.sql<CookingRecord[]>`
        SELECT * FROM cooking_records
        WHERE sauce_id = ${sauceId} AND user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limitNum}
      `;
    }

    const records = await query;
    return records;
  });

  // 조리 기록 상세 조회
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const [record] = await fastify.sql<CookingRecord[]>`
      SELECT * FROM cooking_records
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!record) {
      return reply.code(404).send({ error: '조리 기록을 찾을 수 없습니다.' });
    }

    return record;
  });

  // 조리 기록 생성
  fastify.post('/', async (request, reply) => {
    const userId = request.user!.userId;
    const { sauce_id, photo_url, notes, rating, ingredient_amounts } = request.body as {
      sauce_id: string;
      photo_url?: string;
      notes?: string;
      rating?: number;
      ingredient_amounts: Record<string, number>;
    };

    // 소스 소유권 확인
    const [sauce] = await fastify.sql<Sauce[]>`
      SELECT id FROM sauces
      WHERE id = ${sauce_id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!sauce) {
      return reply.code(404).send({ error: '소스를 찾을 수 없습니다.' });
    }

    // 별점 검증
    if (rating !== undefined && rating !== null) {
      if (rating < 1 || rating > 5) {
        return reply.code(400).send({ error: '별점은 1~5 사이여야 합니다.' });
      }
    }

    const [record] = await fastify.sql<CookingRecord[]>`
      INSERT INTO cooking_records (sauce_id, user_id, photo_url, notes, rating, ingredient_amounts)
      VALUES (
        ${sauce_id},
        ${userId},
        ${photo_url || null},
        ${notes || null},
        ${rating || null},
        ${JSON.stringify(ingredient_amounts)}
      )
      RETURNING *
    `;

    return record;
  });

  // 조리 기록 수정
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const { photo_url, notes, rating, ingredient_amounts } = request.body as {
      photo_url?: string;
      notes?: string;
      rating?: number;
      ingredient_amounts?: Record<string, number>;
    };

    // 별점 검증
    if (rating !== undefined && rating !== null) {
      if (rating < 1 || rating > 5) {
        return reply.code(400).send({ error: '별점은 1~5 사이여야 합니다.' });
      }
    }

    const updates: any = {};
    if (photo_url !== undefined) updates.photo_url = photo_url || null;
    if (notes !== undefined) updates.notes = notes || null;
    if (rating !== undefined) updates.rating = rating || null;
    if (ingredient_amounts !== undefined) updates.ingredient_amounts = JSON.stringify(ingredient_amounts);

    if (Object.keys(updates).length === 0) {
      const [record] = await fastify.sql<CookingRecord[]>`
        SELECT * FROM cooking_records
        WHERE id = ${id} AND user_id = ${userId}
        LIMIT 1
      `;
      return record;
    }

    const [record] = await fastify.sql<CookingRecord[]>`
      UPDATE cooking_records
      SET ${fastify.sql(updates)}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    if (!record) {
      return reply.code(404).send({ error: '조리 기록을 찾을 수 없습니다.' });
    }

    return record;
  });

  // 조리 기록 삭제
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const result = await fastify.sql`
      DELETE FROM cooking_records
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (result.count === 0) {
      return reply.code(404).send({ error: '조리 기록을 찾을 수 없습니다.' });
    }

    return { success: true };
  });
}
