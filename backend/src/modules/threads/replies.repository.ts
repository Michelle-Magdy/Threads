import { query } from "../../db/db.js";
import { BadRequest, NotFoundError } from "../../lib/errors.js";
import { UserProfile } from "../users/user.types.js";
import { Comment, CommentRow, mapCommentRow } from "./thread.types.js";

// list all comments for threads
export async function listCommentsForThread(
  threadId: number,
  userId: number,
): Promise<Comment[]> {
  if (!Number.isInteger(threadId) || threadId <= 0) {
    throw new BadRequest("invalid thread id");
  }
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new BadRequest("invalid user id");
  }

  const result = await query<CommentRow>(
    `
        SELECT 
            c.id,
            u.display_name AS display_name,
            u.handle AS handle,
            c.likes_count,
            c.parent_id,
            u.avatar_url AS avatar_url,
            c.body,
        (cl.user_id IS NOT NULL) AS is_liked,
            c.created_at
        FROM thread_comments AS c
        JOIN users AS u ON c.user_id = u.id
        LEFT JOIN comment_likes AS cl ON cl.comment_id = c.id AND cl.user_id = $2
        WHERE c.thread_id = $1
        ORDER BY created_at ASC
        `,
    [threadId, userId],
  );
  return result.rows.map((row) => mapCommentRow(row));
}

// create comment
export async function createComment(
  threadId: number,
  profile: UserProfile,
  body: string,
  parent_id?: number,
) {
  const hasParent =
    typeof parent_id === "number" && Number.isInteger(parent_id);
  const cols = hasParent ? ", parent_id" : "";
  const placeholders = hasParent ? "$1,$2,$3,$4" : "$1,$2,$3";
  const params = hasParent
    ? [threadId, profile.user.id, body, parent_id]
    : [threadId, profile.user.id, body];

  const result = await query<{ id: number; created_at: Date }>(
    `
        INSERT INTO thread_comments(thread_id, user_id, body${cols})
        SELECT ${placeholders}
        ${hasParent ? "WHERE EXISTS (SELECT 1 FROM thread_comments WHERE id = $4 AND thread_id = $1)" : ""}
        RETURNING id, created_at
        `,
    params,
  );

  const row = result.rows[0];

  const fullRes = await query<CommentRow>(
    ` SELECT 
            c.id,
            u.display_name AS display_name,
            c.parent_id,
            c.likes_count,
            u.handle AS handle,
            u.avatar_url AS avatar_url,
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

  return mapCommentRow(commentRow);
}

// find comment author
export async function findCommentAuthor(commentId: number) {
  const result = await query<{ user_id: number }>(
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
  return row.user_id;
}

// delete comment
export async function deleteComment(commentId: number) {
  await query(
    `
        DELETE FROM thread_comments
        WHERE id = $1
        `,
    [commentId],
  );
}

// like
export async function toggleLikeThread(userId: number, threadId: number) {
  const result = await query(
    `
        WITH deleted AS(
          DELETE FROM thread_likes
          WHERE user_id = $1 AND thread_id = $2
          RETURNING *
        )
        WITH inserted(
          INSERT INTO thread_likes(user_id,thread_id)
          SELECT $1,$2
          WHERE NOT EXISTS(SELECT 1 FROM deleted)
          ON CONFLICT (thread_id,user_id) DO NOTHING
          )
        SELECT 
          CASE 
            WHEN EXISTS (SELECT 1 FROM inserted) THEN 'LIKED'
            ELSE 'UNLIKED'
          END AS action
        `,
    [userId, threadId],
  );
  return result.rows[0].action;
}

export async function toggleLikeComment(userId: number, commentId: number) {
  const result =  await query<{action:string;}>(
    `
        WITH deleted AS(
          DELETE FROM comment_likes
          WHERE user_id = $1 AND comment_id = $2
          RETURNING *
        )
        WITH inserted(
          INSERT INTO comment_likes(user_id,comment_id)
          SELECT $1,$2
          WHERE NOT EXISTS(SELECT 1 FROM deleted)
          ON CONFLICT (comment_id,user_id) DO NOTHING
          RETURNING id
          )
        SELECT 
          CASE 
            WHEN EXISTS (SELECT 1 FROM inserted) THEN 'LIKED'
            ELSE 'UNLIKED'
          END AS action
        `,
    [userId, commentId],
  );
  return result.rows[0].action;
}

// isLiked
export async function findIsLiked(userId: number, threadId: number) {
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
