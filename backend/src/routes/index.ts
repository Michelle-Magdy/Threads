import { Router } from "express";
import userRouter from "./user.routes.js";


const apiRouter = Router();

apiRouter.get('/me',userRouter);


export default apiRouter;