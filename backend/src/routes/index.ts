import { Router } from "express";
import userRouter from "./user.routes.js";
import threadsRouter from "./thread.routes.js";


const apiRouter = Router();

apiRouter.use('/me',userRouter);
apiRouter.use('/threads',threadsRouter);


export default apiRouter;