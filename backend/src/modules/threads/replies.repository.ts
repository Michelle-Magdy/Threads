import { query } from "../../db/db.js";
import { BadRequest, NotFoundError } from "../../lib/errors.js";
import { Comment, CommentRow, mapCommentRow } from "./thread.types.js";

// list all comments for threads
export async function listCommentsForThread(
  threadId: number,
): Promise<Comment[]> {
  if (!Number.isInteger(threadId) || threadId <= 0) {
    throw new BadRequest("invalid thread id");
  }

  const result = await query<CommentRow>(
    `
        SELECT 
            c.id,
            u.display_name AS display_name,
            u.handle AS handle,
            c.body,
            c.created_at
        FROM thread_comments AS c
        JOIN users AS u ON c.user_id = u.id
        WHERE c.thread_id = $1
        ORDER BY created_at ASC
        `,
    [threadId],
  );
  return result.rows.map((row) => mapCommentRow(row));
}

// create comment
export async function createComment(
  threadId: number,
  authorId: number,
  body: string,
) {
  const result = await query<{ id: number; created_at: Date }>(
    `
        INSERT INTO thread_comments(thread_id,user_id,body)
        VALUES ($1,$2,$3)
        RETURNING id, created_at
        `,
    [threadId, authorId, body],
  );

  const row = result.rows[0];

  const fullRes = await query<CommentRow>(
    ` SELECT 
            c.id,
            u.display_name AS display_name,
            u.handle AS handle,
            c.body,
            c.created_at
        FROM thread_comments AS c
        JOIN users AS u ON c.user_id = u.id
        WHERE c.id = $1
        ORDER BY created_at ASC
        `,
    [row.id],
  );

  const commentRow = fullRes.rows[0];

  return {
    id: commentRow.id as number,
    body: commentRow.body as string,
    createAt: commentRow.created_at as Date,
    author: {
      displayName: (commentRow.display_name as string) ?? null,
      handle: (commentRow.handle as string) ?? null,
    },
  };
}

// find comment author
export async function findCommentAuthor(commentId: number) {
  const result = await query<{ userId: number }>(
    `
        SELECT 
            user_id
        FROM thread_comments
        WHERE id = $1
        LIMIT 1
        `,
    [commentId],
  );
  const row = result.rows[0];

  if (!row) {
    throw new NotFoundError("the comment is not found");
  }
  return row.userId;
}

// delete comment
export async function deleteComment(commentId: number) {
  await query(
    `
        DELETE FROM thread_comments
        WHERE id = $
        `,
    [commentId],
  );
}

// like
export async function likeThread(userId: number, threadId: number) {
  await query(
    `
        INSERT INTO thread_likes(user_id,thread_id)
        VALUES ($1,$2)
        ON CONFLICT (thread_id,user_id) DO NOTHING
        `,
    [userId, threadId],
  );
}
// remove like
export async function removeLikeFromThread(userId: number, threadId: number) {
  await query(
    `
        DELETE FROM thread_likes
        WHERE thread_id = $1 AND user_id = $2
        `,
    [threadId, userId],
  );
}

// isLiked 
export async function findIsLiked(userId:number,threadId:number){
    const likesResult = await query(
      `
        SELECT 1
        FROM thread_likes
        WHERE user_id = $1 AND thread_id = $2
        `,
      [userId, threadId],
    );
    let isLiked = false;
    if (likesResult && (likesResult?.rowCount ?? 0) > 0) isLiked = true;

    return isLiked;
}
