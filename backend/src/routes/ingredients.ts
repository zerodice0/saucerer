import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { Ingredient, Sauce } from '../types/database.js';

export async function setupIngredients(fastify: FastifyInstance) {
  // 모든 라우트에 인증 필요
  fastify.addHook('onRequest', authenticate);

  // 재료 목록 조회 (특정 소스)
  fastify.get('/sauce/:sauceId', async (request, reply) => {
    const { sauceId } = request.params as { sauceId: string };
    const userId = request.user!.userId;

    // 소스 소유권 확인
    const [sauce] = await fastify.sql<Sauce[]>`
      SELECT id FROM sauces
      WHERE id = ${sauceId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!sauce) {
      return reply.code(404).send({ error: '소스를 찾을 수 없습니다.' });
    }

    const ingredients = await fastify.sql<Ingredient[]>`
      SELECT * FROM ingredients
      WHERE sauce_id = ${sauceId}
      ORDER BY created_at ASC
    `;

    return ingredients;
  });

  // 재료 생성
  fastify.post('/', async (request, reply) => {
    const userId = request.user!.userId;
    const { sauce_id, name, amount, unit } = request.body as {
      sauce_id: string;
      name: string;
      amount: number;
      unit?: string;
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

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: '재료 이름을 입력해주세요.' });
    }

    const [ingredient] = await fastify.sql<Ingredient[]>`
      INSERT INTO ingredients (sauce_id, name, amount, unit)
      VALUES (${sauce_id}, ${name.trim()}, ${amount || 0}, ${unit || '큰술'})
      RETURNING *
    `;

    return ingredient;
  });

  // 재료 수정
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const { name, amount, unit } = request.body as {
      name?: string;
      amount?: number;
      unit?: string;
    };

    // 재료가 속한 소스의 소유권 확인
    const [existing] = await fastify.sql<Ingredient[]>`
      SELECT i.* FROM ingredients i
      JOIN sauces s ON i.sauce_id = s.id
      WHERE i.id = ${id} AND s.user_id = ${userId}
      LIMIT 1
    `;

    if (!existing) {
      return reply.code(404).send({ error: '재료를 찾을 수 없습니다.' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (amount !== undefined) updates.amount = amount;
    if (unit !== undefined) updates.unit = unit;

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    const [ingredient] = await fastify.sql<Ingredient[]>`
      UPDATE ingredients
      SET ${fastify.sql(updates)}
      WHERE id = ${id}
      RETURNING *
    `;

    return ingredient;
  });

  // 재료 삭제
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    // 재료가 속한 소스의 소유권 확인
    const result = await fastify.sql`
      DELETE FROM ingredients
      WHERE id = ${id}
      AND sauce_id IN (
        SELECT id FROM sauces WHERE user_id = ${userId}
      )
    `;

    if (result.count === 0) {
      return reply.code(404).send({ error: '재료를 찾을 수 없습니다.' });
    }

    return { success: true };
  });
}
