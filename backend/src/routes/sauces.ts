import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { Sauce, InsertSauce, Ingredient } from '../types/database.js';

export async function setupSauces(fastify: FastifyInstance) {
  // 모든 라우트에 인증 필요
  fastify.addHook('onRequest', authenticate);

  // 소스 목록 조회
  fastify.get('/', async (request, reply) => {
    const userId = request.user!.userId;

    const sauces = await fastify.sql<Sauce[]>`
      SELECT * FROM sauces
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return sauces;
  });

  // 소스 상세 조회 (재료 포함)
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const [sauce] = await fastify.sql<Sauce[]>`
      SELECT * FROM sauces
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!sauce) {
      return reply.code(404).send({ error: '소스를 찾을 수 없습니다.' });
    }

    const ingredients = await fastify.sql<Ingredient[]>`
      SELECT * FROM ingredients
      WHERE sauce_id = ${id}
      ORDER BY created_at ASC
    `;

    return {
      ...sauce,
      ingredients,
    };
  });

  // 소스 생성
  fastify.post('/', async (request, reply) => {
    const userId = request.user!.userId;
    const { name, ingredients } = request.body as {
      name: string;
      ingredients?: Array<{ name: string; amount: number; unit: string }>;
    };

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: '소스 이름을 입력해주세요.' });
    }

    // 트랜잭션 시작
    const [sauce] = await fastify.sql<Sauce[]>`
      INSERT INTO sauces (name, user_id)
      VALUES (${name.trim()}, ${userId})
      RETURNING *
    `;

    // 재료 추가
    if (ingredients && ingredients.length > 0) {
      await fastify.sql`
        INSERT INTO ingredients ${fastify.sql(
          ingredients.map(ing => ({
            sauce_id: sauce.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit || '큰술',
          }))
        )}
      `;
    }

    return sauce;
  });

  // 소스 수정
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const { name } = request.body as { name: string };

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: '소스 이름을 입력해주세요.' });
    }

    const [sauce] = await fastify.sql<Sauce[]>`
      UPDATE sauces
      SET name = ${name.trim()}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    if (!sauce) {
      return reply.code(404).send({ error: '소스를 찾을 수 없습니다.' });
    }

    return sauce;
  });

  // 소스 삭제
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const result = await fastify.sql`
      DELETE FROM sauces
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (result.count === 0) {
      return reply.code(404).send({ error: '소스를 찾을 수 없습니다.' });
    }

    return { success: true };
  });
}
