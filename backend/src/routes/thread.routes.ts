import { Router } from "express";
import { createThreadHandler, getAllCategoriesHandler, getThreadByIdHandler, getThreadsHandler } from "../modules/threads/thread.controller.js";

const threadsRouter = Router();

// Get api/v1/threads/categories
threadsRouter.get("/categories", getAllCategoriesHandler);

// post api/v1/threads
threadsRouter.post("/",createThreadHandler);

// get api/v1/threads/threads
threadsRouter.get("/threads",getThreadsHandler)

//Get api/v1/threads/:threadId
threadsRouter.get("/:threadId",getThreadByIdHandler)

export default threadsRouter;



