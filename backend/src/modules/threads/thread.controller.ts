import { NextFunction, Request, Response } from "express";
import {
  createNewThread,
  getThreadById,
  listCategories,
  listThreads,
  parseThreadsFilterList,
} from "./thread.repository.js";
import z from "zod";
import { getAuth } from "@clerk/express";
import { BadRequest, UnAuthorizedError } from "../../lib/errors.js";
import { getUserFromClerk } from "../users/user.service.js";
import { createComment, deleteComment, findCommentAuthor, likeThread, listCommentsForThread, removeLikeFromThread } from "./replies.repository.js";
import { fetchThreadWithDetails } from "./thread.service.js";

const ThreadSchema = z.object({
  title: z.string().trim().min(3),
  body: z.string().trim().min(10),
  categorySlug: z.string().trim(),
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
    const threadId = Number(req.params);

    if (!Number.isInteger(threadId)) {
      throw new BadRequest("thread id must be number");
    }

    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("you are not authorized to create thread");
    }

    const profile = await getUserFromClerk(userId);

    const thread = await fetchThreadWithDetails(threadId,profile.user.id);

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

    console.log(threadsList);
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
    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId)) {
      throw new BadRequest("thread id must be number");
    }

    const comments = await listCommentsForThread(threadId);

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

    const bodyRaw = typeof req?.body?.body === "string" ? req.body.body : "";
    if (bodyRaw.trim().length <= 2) {
      throw new BadRequest("the comment is too short");
    }

    const profile = await getUserFromClerk(userId);

    const comment = await createComment(threadId, profile.user.id, bodyRaw);

    // notification ->trigger-> to the thread author
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

    if(profile.user.id !== authorId){
      throw new UnAuthorizedError("you are not authorized to delete this comment");
    }

    await deleteComment(commentId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function likeThreadHandler(
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

    await likeThread(profile.user.id,threadId);

    // send notification to author of the thread

    res.status(204).send();


  }catch(err){
    next(err);
  }
}

export async function removeLikeThreadHandler(
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

    await removeLikeFromThread(profile.user.id, threadId);

    // send notification to author of the thread

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
