import { query } from "../../db/db.js";
import { BadRequest, NotFoundError } from "../../lib/errors.js";
import {
  Category,
  CategoryRow,
  hydrateCategoryRow,
  hydrateThreadDetailRow,
  hydrateThreadSummaryRow,
  ThreadDetail,
  ThreadDetailRow,
  ThreadListFilter,
  ThreadSummary,
  ThreadSummaryRow,
} from "./thread.types.js";

export async function listCategories(): Promise<Category[]> {
  const result = await query<CategoryRow>(`
        SELECT id,slug,name,description 
        FROM categories
        ORDER BY name ASC
        `);

  return result.rows.map(hydrateCategoryRow);
}

export async function createNewThread(params: {
  title: string;
  body: string;
  categorySlug: string;
  authorId: number;
}): Promise<ThreadDetail> {
  const { title, body, categorySlug, authorId } = params;

  const categoryRes = await query<{ id: number }>(
    `
        SELECT id
        FROM categories,
        WHERE slug = $1
        LIMIT 1
        `,
    [categorySlug],
  );

  if (categoryRes.rowCount === 0) {
    throw new BadRequest("Invalid Category");
  }
  const categoryId = categoryRes.rows[0].id;

  const result = await query<{ id: number }>(
    `
        INSERT INTO threads(category_id,author_id,title,body)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
        `,
    [categoryId, authorId, title, body],
  );
  const threadId = result.rows[0].id;

  return await getThreadById(threadId);
}

export async function getThreadById(threadId: number): Promise<ThreadDetail> {
  const result = await query<ThreadDetailRow>(
    `
        SELECT 
            t.id,
            t.title, 
            t.body, 
            c.name as category_name, 
            c.slug as category_slug, 
            u.display_name as author_display_name, 
            u.handle as author_handle, 
            u.avatar_url as author_avatar_url,  
            t.created_at,
            t.updated.at
        FROM threads as t
        JOIN categories as c ON t.category_id = c.id
        JOIN users as u ON t.author_id = u.id
        WHERE t.id = $1
        LIMIT 1
        `,
    [threadId],
  );
  if (result.rowCount === 0) {
    throw new NotFoundError("category not found");
  }
  return hydrateThreadDetailRow(result.rows[0]);
}

export function parseThreadsFilterList(queryObj: {
  page?: unknown;
  limit?: unknown;
  categorySlug?: unknown;
  q?: unknown;
  sort?: "new" | "old";
}): ThreadListFilter {
  const { page, limit, categorySlug, q, sort } = queryObj;

  const pageNumber = Number(page) || 1;
  const rawPageSize = Number(limit) || 20;
  const pageSize = Math.min(Math.max(rawPageSize, 20), 30);
  const parsedCategorySlug =
    typeof categorySlug === "string" && categorySlug.length
      ? categorySlug.trim()
      : undefined;
  const parsedQuery = typeof q === "string" && q.length ? q.trim() : undefined;
  const parsedSort = sort === "old" ? "old" : "new";

  return {
    page: pageNumber,
    limit: pageSize,
    categorySlug: parsedCategorySlug,
    search: parsedQuery,
    sort: parsedSort,
  };
}

export async function listThreads(
  filters: ThreadListFilter,
): Promise<ThreadSummary[]> {
  const { page, limit, categorySlug, sort, search } = filters;

  const conditions: unknown[] = [];
  const params: unknown[] = [];

  let idx = 0;

  if (categorySlug) {
    conditions.push(`c.slug = $${idx++}`);
    params.push(categorySlug);
  }

  if (search) {
    conditions.push(`t.title ILIKE $${idx} OR t.body ILIKE $${idx}`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const sortClause = `ORDER BY t.created_at ${sort === "old" ? "DESC" : "ASC"}`;
  const offset = (page - 1) * limit;

  params.push(limit, offset);

  const result = await query<ThreadSummaryRow>(`
        SELECT 
            t.id,
            t.title, 
            LEFT(t.body,200) AS excerpt, 
            c.name as category_name, 
            c.slug as category_slug, 
            u.display_name as author_display_name, 
            u.handle as author_handle, 
            u.avatar_url as author_avatar_url,  
            t.created_at,
            t.updated.at
        FROM threads as t
        JOIN categories as c ON t.category_id = c.id
        JOIN users as u ON t.author_id = u.id
        ${whereClause}
        ${sortClause}
        LIMIT $${idx++} OFFSET $${idx}
    `,params);

    return result.rows.map(hydrateThreadSummaryRow)
}
