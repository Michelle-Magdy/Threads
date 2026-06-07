import { NextFunction, Request, Response } from "express";
import {
  createNewThread,
  listCategories,
  listThreads,
  parseThreadsFilterList,
} from "./thread.repository.js";
import z from "zod";
import { getAuth } from "@clerk/express";
import { BadRequest, UnAuthorizedError } from "../../lib/errors.js";
import { getUserFromClerk } from "../users/user.service.js";
import {
  createComment,
  deleteComment,
  findCommentAuthor,
  toggleLikeThread,
  listCommentsForThread,
  toggleLikeComment,
} from "./replies.repository.js";
import { buildCommentsTree, fetchThreadWithDetails } from "./thread.service.js";
import { createCommentThreadNotification, createLikeThreadNotification ,createReplyCommentNotification,createLikeCommentNotification} from "../notifications/notifications.service.js";
import { threadId } from "node:worker_threads";

const ThreadSchema = z.object({
  title: z.string().trim().min(3),
  body: z.string().trim().min(10),
  categorySlug: z.string().trim(),
});

const CommentSchema = z.object({
  body: z.string().trim().min(3),
  parentId: z.coerce.number().int().positive().optional(),
});

export async function getAllCategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }
    const categoriesList = await listCategories();

    return res.json({ data: categoriesList });
  } catch (err) {
    next(err);
  }
}

export async function createThreadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }

    const parsedBody = ThreadSchema.safeParse(req.body);

    if (parsedBody.error) {
      return res.json({ err: parsedBody.error });
    }

    const profile = await getUserFromClerk(userId);

    const newlyCreatedThread = await createNewThread({
      title: parsedBody.data.title,
      body: parsedBody.data.body,
      categorySlug: parsedBody.data.categorySlug,
      authorId: profile.user.id,
    });

    return res.json({ data: newlyCreatedThread });
  } catch (err) {
    next(err);
  }
}

export async function getThreadByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId)) {
      throw new BadRequest("thread id must be number");
    }

    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }

    const profile = await getUserFromClerk(userId);

    const thread = await fetchThreadWithDetails(threadId, profile.user.id);

    return res.json({ data: thread });
  } catch (err) {
    next(err);
  }
}

export async function getThreadsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sort = req.query.sort === "old" ? "old" : "new";
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }

    const filters = parseThreadsFilterList({
      page: req.query.page,
      limit: req.query.limit,
      categorySlug: req.query.category,
      q: req.query.q,
      sort,
    });

    const threadsList = await listThreads(filters);

    return res.json({
      data: threadsList,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCommentsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }
    const profile = await getUserFromClerk(userId);
    const threadId = Number(req.params.threadId);
    const userIdNum = Number(profile?.user?.id);

    if (!Number.isInteger(threadId)) {
      throw new BadRequest("thread id must be number");
    }
    if (!Number.isInteger(userIdNum)) {
      throw new BadRequest("user id must be number");
    }

    const rawComments = await listCommentsForThread(threadId, userIdNum);

    const comments = buildCommentsTree(rawComments);

    res.json({ data: comments });
  } catch (err) {
    next(err);
  }
}

export async function postCommentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }

    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId)) {
      throw new BadRequest("thread id must be number");
    }
    
    const parsedBody = CommentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ err: parsedBody.error });
    }

    const profile = await getUserFromClerk(userId);

    const comment = await createComment(
      threadId,
      profile,
      parsedBody.data.body,
      parsedBody.data.parentId,
    );

    // fix notification schema to make it works for comments also
    // if(comment.parentId){
    //   console.log(`[parent comment ID] --------> ${comment.parentId}`)
    //   await createReplyCommentNotification({
    //     commentId:comment.parentId,
    //     actorUserId:profile.user.id
    //   })
    // }
    // notification ->trigger-> to the thread author
    await createCommentThreadNotification({
      threadId:threadId,
      actorUserId:profile.user.id
    })
    res.status(201).json({ data: comment });
  } catch (err) {
    next(err);
  }
}

export async function deleteCommentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }

    const commentId = Number(req.params.commentId);

    if (!Number.isInteger(commentId)) {
      throw new BadRequest("thread id must be number");
    }

    const profile = await getUserFromClerk(userId);
    const authorId = await findCommentAuthor(commentId);

    if (profile.user.id !== authorId) {
      throw new UnAuthorizedError(
        "you are not authorized to delete this comment",
      );
    }

    await deleteComment(commentId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function toggleLikeCommentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create comment");
    }

    const commentId = Number(req.params.commentId);

    if (!Number.isInteger(commentId)) {
      throw new BadRequest("comment id must be number");
    }

    const profile = await getUserFromClerk(userId);

    const action = await toggleLikeComment(profile.user.id, commentId);
    if(action === 'LIKED'){
      // send notification to author of the thread
      // await createLikeCommentNotification({
      //   threadId:threadId
      //   commentId:commentId,
      //   actorUserId:profile.user.id
      // })
    }


    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function toggleLikeThreadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }

    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId)) {
      throw new BadRequest("thread id must be number");
    }

    const profile = await getUserFromClerk(userId);

    const action = await toggleLikeThread(profile.user.id, threadId);

    if (action === "LIKED") {
      // send notification to author of the thread
      await createLikeThreadNotification({
        threadId:threadId,
        actorUserId:profile.user.id
      });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
