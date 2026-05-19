import { Router} from "express";
import {z} from 'zod';
import { getMeHandler } from "../modules/users/user.contoller.js";


const userRouter = Router();

const UserProfileUpdateSchema = z.object({
  displayName: z.string().trim().length(50).optional(),
  handle: z.string().trim().length(30).optional(),
  bio: z.string().trim().length(500).optional(),
  avatarURL: z.url().optional(),
});





// get -> /api/v1/me
userRouter.get("/",getMeHandler);




// patch -> /api/v1/me

export default userRouter;