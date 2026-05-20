import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { UnAuthorizedError } from "../../lib/errors.js";
import {
  toUserProfileResponse,
  UserProfile,
  UserProfileResponse,
} from "./user.types.js";
import { getUserFromClerk, updateUserProfile } from "./user.service.js";
import { z } from "zod";
import { logger } from "../../lib/logger.js";

const UserProfileUpdateSchema = z.object({
  displayName: z.string().trim().max(50).min(3).optional(),
  handle: z.string().trim().max(30).min(3).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.url().optional(),
});

function toResponse(profile: UserProfile): UserProfileResponse {
  return toUserProfileResponse(profile);
}

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("user is unauthorized");
    }

    const profile = await getUserFromClerk(userId);
    return res.json({ data: toResponse(profile) });
  } catch (err) {
    next(err);
  }
}

export async function updateMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("user is unauthorized");
    }
    const parsedProfile = UserProfileUpdateSchema.parse(req.body);

    const displayName =
      parsedProfile.displayName && parsedProfile.displayName.trim().length > 0
        ? parsedProfile.displayName
        : undefined;

    const handle =
      parsedProfile.handle && parsedProfile.handle.trim().length > 0
        ? parsedProfile.handle
        : undefined;

    const avatarURL =
      parsedProfile.avatarUrl && parsedProfile.avatarUrl.trim().length > 0
        ? parsedProfile.avatarUrl
        : undefined;

    const bio =
      parsedProfile.bio && parsedProfile.bio.trim().length > 0
        ? parsedProfile.bio
        : undefined;
        

    const updatedProfile = await updateUserProfile({
      clerkUserId: userId,
      displayName,handle,avatarURL,bio
    });

    return res.json({data: toResponse(updatedProfile)});


  } catch (err) {
    next(err);
  }
}
