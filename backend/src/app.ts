import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { clerkMiddleware } from "@clerk/express";
import apiRouter from "./routes/index.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true, // for cookies
    }),
  );
  app.use(clerkMiddleware());
  app.use(express.json());

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
