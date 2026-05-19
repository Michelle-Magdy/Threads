import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { UnAuthorizedError } from "../../lib/errors.js";
import { toUserProfileResponse, UserProfile, UserProfileResponse } from "./user.types.js";
import { getUserFromClerk } from "./user.service.js";


function toResponse(profile: UserProfile): UserProfileResponse {
  return toUserProfileResponse(profile);
}


export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("user is unauthorized");
    }

    const profile = await getUserFromClerk(userId);
    return res.json({data:toResponse(profile)});
  } catch (err) {
    next(err);
  }
}
