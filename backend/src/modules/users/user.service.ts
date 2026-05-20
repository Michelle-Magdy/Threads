import { clerkClient } from "@clerk/express";
import { UserProfile } from "./user.types.js";
import { repoUpdateUserProfile, upsertUserFromClerkProfile } from "./user.repository.js";
import { logger } from "../../lib/logger.js";

async function fetchClerkProfile(userId: string) {
  const clerkUser = await clerkClient.users.getUser(userId);

  const fullName = clerkUser.fullName ?? null;
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const avatarURL = clerkUser.imageUrl ?? null;
  return { fullName, email, avatarURL };
}

export async function getUserFromClerk(
  clerkUserId: string,
): Promise<UserProfile> {
  const { fullName, avatarURL, email } = await fetchClerkProfile(clerkUserId);

  const user = await upsertUserFromClerkProfile({
    clerkUserId,
    displayName: fullName,
    avatarURL,
  });

  return {
    user: user,
    clerkEmail: email,
    clerkFullName: fullName,
  };
}

export async function updateUserProfile(params: {
  clerkUserId: string;
  displayName?: string;
  handle?: string;
  avatarURL?: string;
  bio?: string;
}): Promise<UserProfile> {
  const { clerkUserId, displayName, handle, avatarURL, bio } = params;
  // ok
  const updatedProfile = await repoUpdateUserProfile({
    clerkUserId,
    displayName,
    handle,
    avatarURL,
    bio,
  });

  const {fullName,email} =await fetchClerkProfile(clerkUserId);

  return {
    user:updatedProfile,
    clerkEmail:email,
    clerkFullName:fullName
  };
}
