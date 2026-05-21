import { NextFunction, Request, Response } from "express";
import { createNewThread, getThreadById, listCategories, listThreads, parseThreadsFilterList } from "./thread.repository.js";
import z from "zod";
import { getAuth } from "@clerk/express";
import { BadRequest, UnAuthorizedError } from "../../lib/errors.js";
import { getUserFromClerk } from "../users/user.service.js";

const ThreadSchema = z.object({
    title:z.string().trim().min(3),
    body: z.string().trim().min(10),
    categorySlug:z.string().trim(),

})


export async function getAllCategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
     const {userId} = getAuth(req);
        if(!userId){
            throw new UnAuthorizedError("you are not authorized to create thread");
        }
    const categoriesList = await listCategories();

    return res.json({ data: categoriesList });
  } catch (err) {
    next(err);
  }
}

export async function createThreadHandler(req:Request,res:Response,next:NextFunction){
    try{
        const {userId} = getAuth(req);
        if(!userId){
            throw new UnAuthorizedError("you are not authorized to create thread");
        }

        const parsedBody = ThreadSchema.safeParse(req.body);

        if(parsedBody.error){
            return res.json({err:parsedBody.error})
        }

        const profile = await getUserFromClerk(userId);

        const newlyCreatedThread = await createNewThread({
            title:parsedBody.data.title,
            body:parsedBody.data.body,
            categorySlug:parsedBody.data.categorySlug,
            authorId: profile.user.id
        })

        return res.json({ data: newlyCreatedThread });

    }catch(err){
        next(err);
    }
}

export async function getThreadByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
    try{
        const threadId = Number(req.params);

        if(!Number.isInteger(threadId)){
            throw new BadRequest("thread id must be number");
        }

         const { userId } = getAuth(req);
         if (!userId) {
           throw new UnAuthorizedError(
             "you are not authorized to create thread",
           );
         }

        const fetchedThread = await getThreadById(threadId);

        return res.json({data: fetchedThread})

    }catch(err){
        next(err);
    }
}


export async function getThreadsHandler(req:Request,res:Response,next:NextFunction){
    try{
        const filters = parseThreadsFilterList({
          page: req.body.page,
          limit: req.body.limit,
          categorySlug: req.body.categorySlug,
          q: req.body.q,
          sort: req.body.sort,
        });

        const threadsList = await listThreads(filters);
        
        return res.json({data: threadsList});

    }catch(err){
        next(err);
    }
}