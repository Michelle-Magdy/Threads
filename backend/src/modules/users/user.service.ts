import { clerkClient } from "@clerk/express";
import { UserProfile } from "./user.types.js";
import { upsertUserFromClerkProfile } from "./user.repository.js";

async function fetchClerkProfile(userId:string){
    const clerkUser = await clerkClient.users.getUser(userId);

    const fullName =  clerkUser.fullName ?? null;
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
    const avatarURL = clerkUser.imageUrl ?? null;
    return {fullName,email,avatarURL};
}

export async function getUserFromClerk(clerkUserId: string):Promise<UserProfile>{
    const {fullName,avatarURL,email} = await fetchClerkProfile(clerkUserId);

    const user  = await upsertUserFromClerkProfile({clerkUserId,displayName:fullName,avatarURL});

    return {
        user:user,
        clerkEmail:email,
        clerkFullName:fullName
    }
}