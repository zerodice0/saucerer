import { Hono } from 'hono';
import { createDb } from '../utils/db';
import { authenticate, getUser } from '../middleware/auth';
import type { Env } from '../types/env';
import type { Sauce, Ingredient } from '../types/database';

const sauces = new Hono<{ Bindings: Env }>();

// 모든 라우트에 인증 적용
sauces.use('*', authenticate);

/**
 * 소스 목록 조회
 */
sauces.get('/', async (c) => {
  try {
    const user = getUser(c);
    const db = createDb(c.env);

    const result = await db`
      SELECT * FROM sauces
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
    `;

    return c.json(result as Sauce[]);
  } catch (error) {
    console.error('소스 목록 조회 실패:', error);
    return c.json({ error: '소스 목록 조회 실패' }, 500);
  }
});

/**
 * 소스 상세 조회 (재료 포함)
 */
sauces.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const db = createDb(c.env);

    const sauceResult = await db`
      SELECT * FROM sauces
      WHERE id = ${id} AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (sauceResult.length === 0) {
      return c.json({ error: '소스를 찾을 수 없습니다.' }, 404);
    }

    const sauce = sauceResult[0] as Sauce;

    const ingredients = await db`
      SELECT * FROM ingredients
      WHERE sauce_id = ${id}
      ORDER BY created_at ASC
    `;

    return c.json({
      ...sauce,
      ingredients: ingredients as Ingredient[],
    });
  } catch (error) {
    console.error('소스 조회 실패:', error);
    return c.json({ error: '소스 조회 실패' }, 500);
  }
});

/**
 * 소스 생성
 */
sauces.post('/', async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json() as {
      name: string;
      ingredients?: Array<{ name: string; amount: number; unit: string }>;
    };

    if (!body.name || !body.name.trim()) {
      return c.json({ error: '소스 이름을 입력해주세요.' }, 400);
    }

    const db = createDb(c.env);

    // 소스 생성
    const sauceResult = await db`
      INSERT INTO sauces (name, user_id)
      VALUES (${body.name.trim()}, ${user.userId})
      RETURNING *
    `;

    const sauce = sauceResult[0] as Sauce;

    // 재료 추가
    if (body.ingredients && body.ingredients.length > 0) {
      const values = body.ingredients.map((ing) => ({
        sauce_id: sauce.id,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit || '큰술',
      }));

      for (const ing of values) {
        await db`
          INSERT INTO ingredients (sauce_id, name, amount, unit)
          VALUES (${ing.sauce_id}, ${ing.name}, ${ing.amount}, ${ing.unit})
        `;
      }
    }

    return c.json(sauce);
  } catch (error) {
    console.error('소스 생성 실패:', error);
    return c.json({ error: '소스 생성 실패' }, 500);
  }
});

/**
 * 소스 수정
 */
sauces.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const body = await c.req.json() as { name: string };

    if (!body.name || !body.name.trim()) {
      return c.json({ error: '소스 이름을 입력해주세요.' }, 400);
    }

    const db = createDb(c.env);

    const result = await db`
      UPDATE sauces
      SET name = ${body.name.trim()}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return c.json({ error: '소스를 찾을 수 없습니다.' }, 404);
    }

    return c.json(result[0] as Sauce);
  } catch (error) {
    console.error('소스 수정 실패:', error);
    return c.json({ error: '소스 수정 실패' }, 500);
  }
});

/**
 * 소스 삭제
 */
sauces.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const db = createDb(c.env);

    const result = await db`
      DELETE FROM sauces
      WHERE id = ${id} AND user_id = ${user.userId}
    `;

    // @neondatabase/serverless는 count 속성이 없으므로 rowCount 사용
    if (!result || result.length === 0) {
      return c.json({ error: '소스를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('소스 삭제 실패:', error);
    return c.json({ error: '소스 삭제 실패' }, 500);
  }
});

export default sauces;
