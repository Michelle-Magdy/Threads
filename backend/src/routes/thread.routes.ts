import { Router } from "express";
import {
  createThreadHandler,
  deleteCommentHandler,
  getAllCategoriesHandler,
  getCommentsHandler,
  getThreadByIdHandler,
  getThreadsHandler,
  likeThreadHandler,
  postCommentHandler,
  removeLikeThreadHandler,
} from "../modules/threads/thread.controller.js";

const threadsRouter = Router();

// Get api/v1/threads/categories
threadsRouter.get("/categories", getAllCategoriesHandler);

// post api/v1/threads
threadsRouter.post("/", createThreadHandler);

// get api/v1/threads/threads
threadsRouter.get("/threads", getThreadsHandler);

//Get api/v1/threads/:threadId
threadsRouter.get("/:threadId", getThreadByIdHandler);

// comments and likes
threadsRouter.get("/:threadId/comments", getCommentsHandler);

threadsRouter.post("/:threadId/comments", postCommentHandler);

threadsRouter.delete("/comments/:commentId", deleteCommentHandler);

threadsRouter.post("/:threadId/like", likeThreadHandler);

threadsRouter.delete("/:threadId/like", removeLikeThreadHandler);

export default threadsRouter;
