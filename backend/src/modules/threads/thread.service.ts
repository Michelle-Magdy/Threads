import { query } from "../../db/db.js";
import { findIsLiked } from "./replies.repository.js";
import { getThreadById } from "./thread.repository.js";
import { Comment } from "./thread.types.js";

export async function fetchThreadWithDetails(
  threadId: number,
  viewerId: number,
) {
  const thread = await getThreadById(threadId);
  const isLiked = await findIsLiked(viewerId, threadId);
  return {
    ...thread,
    isLiked,
  };
}

export function buildCommentsTree(rawComments: Comment[]): Comment[] {
  const commentMap = new Map<number, Comment>();
  rawComments.map((comment) => {
    commentMap.set(comment.id, comment);
  });
  const rootComments: Comment[] = [];
  for (let comment of rawComments) {
    if (comment.parentId === null || comment.parentId === 0) {
      rootComments.push(comment);
    } else {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    }
  }

  return rootComments;
}
