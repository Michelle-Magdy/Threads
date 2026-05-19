

export type UserRow = {
  id: number;
  clerk_user_id: string | null;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
};



export type User = {
  id: number;
  clerkUserId: string | null;
  displayName: string | null;
  handle: string | null;
  avatarURL: string | null;
  bio: string | null;
  createdAt:Date;
  updatedAt:Date;
};


export type UserProfile ={
    user :User;
    clerkEmail: string |null;

    clerkFullName: string | null;
}

export type UserProfileResponse = {
  id: number;
  clerkUserId: string | null;
  email:string | null;
  displayName: string | null;
  handle: string | null;
  avatarURL: string | null;
  bio: string | null;
};

export function toUserProfileResponse(profile:UserProfile) : UserProfileResponse{
    const { user, clerkEmail,clerkFullName} = profile;
    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: clerkEmail ?? null,
      displayName: user.displayName ?? clerkFullName ?? null,
      handle: user.handle ?? null,
      avatarURL: user.avatarURL ?? null,
      bio: user.bio ?? null,
    };
}