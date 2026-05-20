import { query } from "../../db/db.js";
import { logger } from "../../lib/logger.js";
import { User, UserRow } from "./user.types.js";

function hydrateUserRow(row: UserRow): User {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    handle: row.handle,
    avatarURL: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertUserFromClerkProfile(params: {
  clerkUserId: string;
  displayName: string | null;
  avatarURL: string | null;
}): Promise<User> {
  const { clerkUserId, displayName, avatarURL } = params;

  const result = await query<UserRow>(
    `
        INSERT INTO users(clerk_user_id,display_name,avatar_url)
        VALUES ($1, $2, $3)
        ON CONFLICT(clerk_user_id)
        DO UPDATE SET
            updated_at   = NOW()
        RETURNING
            id,
            clerk_user_id,
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


export async function repoUpdateUserProfile(params: {
  clerkUserId: string;
  displayName?: string;
  handle?: string;
  avatarURL?: string;
  bio?: string;
}):Promise<User>{
  const { clerkUserId, displayName, handle, avatarURL, bio } = params;
  // user can update some not all 
  const setClause: string[]=[];
  const values: unknown[]=[clerkUserId];
  
  let idx = 2;
  if(typeof displayName !== undefined){
    setClause.push(`display_name = $${idx++}`);
    values.push(displayName);
  }
  if(typeof handle !== undefined){
    setClause.push(`handle = $${idx++}`);
    values.push(handle);
  }
  if(typeof avatarURL !== undefined){
    setClause.push(`avatar_url = $${idx++}`);
    values.push(avatarURL);
  }
  if (typeof bio !== undefined) {
    setClause.push(`bio = $${idx++}`);
    values.push(bio);
  }

  setClause.push(`updated_at = NOW()`);
  
 

  const q = `
    UPDATE users
    SET ${setClause.join(", ")}
    WHERE clerk_user_id = $1
    RETURNING
            id,
            clerk_user_id,
            display_name,
            handle,
            avatar_url,
            bio,
            created_at,
            updated_at
    `;

  const result = await query<UserRow>(
    q,
    values,
  );
  if(result.rows.length === 0){
    throw new Error("there is no user with this clerk user id");
  }

  return hydrateUserRow(result.rows[0]);


}