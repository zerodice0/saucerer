import { Hono } from 'hono';
import { createDb } from '../utils/db';
import { authenticate, getUser } from '../middleware/auth';
import type { Env } from '../types/env';
import type { Ingredient, Sauce } from '../types/database';

const ingredients = new Hono<{ Bindings: Env }>();

// 모든 라우트에 인증 적용
ingredients.use('*', authenticate);

/**
 * 재료 목록 조회 (특정 소스)
 */
ingredients.get('/sauce/:sauceId', async (c) => {
  try {
    const sauceId = c.req.param('sauceId');
    const user = getUser(c);
    const db = createDb(c.env);

    // 소스 소유권 확인
    const sauceResult = await db`
      SELECT id FROM sauces
      WHERE id = ${sauceId} AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (sauceResult.length === 0) {
      return c.json({ error: '소스를 찾을 수 없습니다.' }, 404);
    }

    const result = await db`
      SELECT * FROM ingredients
      WHERE sauce_id = ${sauceId}
      ORDER BY created_at ASC
    `;

    return c.json(result as Ingredient[]);
  } catch (error) {
    console.error('재료 목록 조회 실패:', error);
    return c.json({ error: '재료 목록 조회 실패' }, 500);
  }
});

/**
 * 재료 생성
 */
ingredients.post('/', async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json() as {
      sauce_id: string;
      name: string;
      amount: number;
      unit?: string;
    };

    const db = createDb(c.env);

    // 소스 소유권 확인
    const sauceResult = await db`
      SELECT id FROM sauces
      WHERE id = ${body.sauce_id} AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (sauceResult.length === 0) {
      return c.json({ error: '소스를 찾을 수 없습니다.' }, 404);
    }

    if (!body.name || !body.name.trim()) {
      return c.json({ error: '재료 이름을 입력해주세요.' }, 400);
    }

    const result = await db`
      INSERT INTO ingredients (sauce_id, name, amount, unit)
      VALUES (${body.sauce_id}, ${body.name.trim()}, ${body.amount || 0}, ${body.unit || '큰술'})
      RETURNING *
    `;

    return c.json(result[0] as Ingredient);
  } catch (error) {
    console.error('재료 생성 실패:', error);
    return c.json({ error: '재료 생성 실패' }, 500);
  }
});

/**
 * 재료 수정
 */
ingredients.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const body = await c.req.json() as {
      name?: string;
      amount?: number;
      unit?: string;
    };

    const db = createDb(c.env);

    // 재료가 속한 소스의 소유권 확인
    const existingResult = await db`
      SELECT i.* FROM ingredients i
      JOIN sauces s ON i.sauce_id = s.id
      WHERE i.id = ${id} AND s.user_id = ${user.userId}
      LIMIT 1
    `;

    if (existingResult.length === 0) {
      return c.json({ error: '재료를 찾을 수 없습니다.' }, 404);
    }

    const existing = existingResult[0] as Ingredient;

    // 업데이트할 필드 구성
    const name = body.name !== undefined ? body.name.trim() : existing.name;
    const amount = body.amount !== undefined ? body.amount : existing.amount;
    const unit = body.unit !== undefined ? body.unit : existing.unit;

    const result = await db`
      UPDATE ingredients
      SET name = ${name}, amount = ${amount}, unit = ${unit}
      WHERE id = ${id}
      RETURNING *
    `;

    return c.json(result[0] as Ingredient);
  } catch (error) {
    console.error('재료 수정 실패:', error);
    return c.json({ error: '재료 수정 실패' }, 500);
  }
});

/**
 * 재료 삭제
 */
ingredients.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const db = createDb(c.env);

    // 재료가 속한 소스의 소유권 확인 후 삭제
    const result = await db`
      DELETE FROM ingredients
      WHERE id = ${id}
      AND sauce_id IN (
        SELECT id FROM sauces WHERE user_id = ${user.userId}
      )
    `;

    if (!result || result.length === 0) {
      return c.json({ error: '재료를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('재료 삭제 실패:', error);
    return c.json({ error: '재료 삭제 실패' }, 500);
  }
});

export default ingredients;
