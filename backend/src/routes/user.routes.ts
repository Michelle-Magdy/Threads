import { Router} from "express";
import { getMeHandler, updateMeHandler } from "../modules/users/user.controller.js";


const userRouter = Router();

// get -> /api/v1/me
userRouter.get("/",getMeHandler);

// patch -> /api/v1/me
userRouter.patch("/",updateMeHandler);

export default userRouter;