import { Hono } from 'hono';
import { createDb } from '../utils/db';
import { authenticate, getUser } from '../middleware/auth';
import type { Env } from '../types/env';
import type { CookingRecord, Sauce } from '../types/database';

const cookingRecords = new Hono<{ Bindings: Env }>();

// 모든 라우트에 인증 적용
cookingRecords.use('*', authenticate);

/**
 * 조리 기록 목록 조회 (특정 소스)
 */
cookingRecords.get('/sauce/:sauceId', async (c) => {
  try {
    const sauceId = c.req.param('sauceId');
    const user = getUser(c);
    const limit = c.req.query('limit');
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

    let result;
    if (limit) {
      const limitNum = parseInt(limit, 10);
      result = await db`
        SELECT * FROM cooking_records
        WHERE sauce_id = ${sauceId} AND user_id = ${user.userId}
        ORDER BY created_at DESC
        LIMIT ${limitNum}
      `;
    } else {
      result = await db`
        SELECT * FROM cooking_records
        WHERE sauce_id = ${sauceId} AND user_id = ${user.userId}
        ORDER BY created_at DESC
      `;
    }

    return c.json(result as CookingRecord[]);
  } catch (error) {
    console.error('조리 기록 목록 조회 실패:', error);
    return c.json({ error: '조리 기록 목록 조회 실패' }, 500);
  }
});

/**
 * 조리 기록 상세 조회
 */
cookingRecords.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const db = createDb(c.env);

    const result = await db`
      SELECT * FROM cooking_records
      WHERE id = ${id} AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (result.length === 0) {
      return c.json({ error: '조리 기록을 찾을 수 없습니다.' }, 404);
    }

    return c.json(result[0] as CookingRecord);
  } catch (error) {
    console.error('조리 기록 조회 실패:', error);
    return c.json({ error: '조리 기록 조회 실패' }, 500);
  }
});

/**
 * 조리 기록 생성
 */
cookingRecords.post('/', async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json() as {
      sauce_id: string;
      photo_url?: string;
      notes?: string;
      rating?: number;
      ingredient_amounts: Record<string, number>;
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

    // 별점 검증
    if (body.rating !== undefined && body.rating !== null) {
      if (body.rating < 1 || body.rating > 5) {
        return c.json({ error: '별점은 1~5 사이여야 합니다.' }, 400);
      }
    }

    const result = await db`
      INSERT INTO cooking_records (
        sauce_id, user_id, photo_url, notes, rating, ingredient_amounts
      )
      VALUES (
        ${body.sauce_id},
        ${user.userId},
        ${body.photo_url || null},
        ${body.notes || null},
        ${body.rating || null},
        ${JSON.stringify(body.ingredient_amounts)}
      )
      RETURNING *
    `;

    return c.json(result[0] as CookingRecord);
  } catch (error) {
    console.error('조리 기록 생성 실패:', error);
    return c.json({ error: '조리 기록 생성 실패' }, 500);
  }
});

/**
 * 조리 기록 수정
 */
cookingRecords.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const body = await c.req.json() as {
      photo_url?: string;
      notes?: string;
      rating?: number;
      ingredient_amounts?: Record<string, number>;
    };

    // 별점 검증
    if (body.rating !== undefined && body.rating !== null) {
      if (body.rating < 1 || body.rating > 5) {
        return c.json({ error: '별점은 1~5 사이여야 합니다.' }, 400);
      }
    }

    const db = createDb(c.env);

    // 기존 레코드 조회
    const existingResult = await db`
      SELECT * FROM cooking_records
      WHERE id = ${id} AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (existingResult.length === 0) {
      return c.json({ error: '조리 기록을 찾을 수 없습니다.' }, 404);
    }

    const existing = existingResult[0] as CookingRecord;

    // 업데이트할 필드 구성
    const photoUrl = body.photo_url !== undefined ? body.photo_url : existing.photo_url;
    const notes = body.notes !== undefined ? body.notes : existing.notes;
    const rating = body.rating !== undefined ? body.rating : existing.rating;
    const ingredientAmounts = body.ingredient_amounts !== undefined
      ? JSON.stringify(body.ingredient_amounts)
      : JSON.stringify(existing.ingredient_amounts);

    const result = await db`
      UPDATE cooking_records
      SET photo_url = ${photoUrl || null},
          notes = ${notes || null},
          rating = ${rating || null},
          ingredient_amounts = ${ingredientAmounts}
      WHERE id = ${id} AND user_id = ${user.userId}
      RETURNING *
    `;

    return c.json(result[0] as CookingRecord);
  } catch (error) {
    console.error('조리 기록 수정 실패:', error);
    return c.json({ error: '조리 기록 수정 실패' }, 500);
  }
});

/**
 * 조리 기록 삭제
 */
cookingRecords.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const db = createDb(c.env);

    const result = await db`
      DELETE FROM cooking_records
      WHERE id = ${id} AND user_id = ${user.userId}
    `;

    if (!result || result.length === 0) {
      return c.json({ error: '조리 기록을 찾을 수 없습니다.' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('조리 기록 삭제 실패:', error);
    return c.json({ error: '조리 기록 삭제 실패' }, 500);
  }
});

export default cookingRecords;
