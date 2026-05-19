import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { UnAuthorizedError } from "../lib/errors.js";

export function requireAuthApi(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const { userId, isAuthenticated } = getAuth(req);
  if (!userId || !isAuthenticated) {
    return next(
      new UnAuthorizedError("You must sign in to access this resource"),
    );
  }
  return next();
}
