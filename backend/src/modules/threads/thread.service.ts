import { query } from "../../db/db.js";
import { findIsLiked } from "./replies.repository.js";
import { getThreadById } from "./thread.repository.js";

export async function fetchThreadWithDetails(threadId:number,viewerId:number){
    const thread = await getThreadById(threadId);
    const isLiked = await findIsLiked(viewerId,threadId);
    return {
        ...thread,
        isLiked
    }
}