import { query } from "../../db/db.js";
import { User, UserRow } from "./user.types.js";

function hydrateUserRow(row:UserRow): User{
    return {
        id: row.id,
        clerkUserId: row.clerk_user_id,
        displayName:row.display_name,
        handle:row.handle,
        avatarURL:row.avatar_url,
        bio:row.bio,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
}


export async function upsertUserFromClerkProfile(params: {
  clerkUserId: string;
  displayName: string | null;
  avatarURL: string | null;
}):Promise<User>{

    const {clerkUserId,displayName,avatarURL} = params;

    const result = await query<UserRow>(
      `
        INSERT INTO users(clerk_user_id,display_name,avatar_url)
        VALUES ($1, $2, $3)
        ON CONFLICT(clerk_user_id)
        DO UPDATE SET
            display_name = EXECLUDED.display_name,
            avatar_url   = EXECLUDED.avatar_url,
            updated_at   = NOW()
        RETURNING
            id,
            clerck_user_id,
            display_name,
            handle,
            avatar_url,
            bio,
            created_at,
            updated_at
        `,
      [clerkUserId, displayName, avatarURL],
    );

    return hydrateUserRow(result.rows[0]);


}