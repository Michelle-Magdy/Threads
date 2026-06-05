import { Router } from "express";
import userRouter from "./user.routes.js";
import threadsRouter from "./thread.routes.js";
import { notificationsRouter } from "./notification.route.js";


const apiRouter = Router();

apiRouter.use('/me',userRouter);
apiRouter.use('/threads',threadsRouter);
apiRouter.use('/notifications',notificationsRouter);


export default apiRouter;