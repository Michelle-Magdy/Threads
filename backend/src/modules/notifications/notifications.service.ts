import { query } from "../../db/db.js";
import { mapNotificationRow, NotificationRow } from "./notifications.types.js";


export async function createCommentThreadNotification(params:{
    threadId:number;
    actorUserId:number;
}){
    const {threadId,actorUserId} = params;

    const threadRes = await query(`
        SELECT author_id
        FROM threads
        WHERE id = $1
        LIMIT 1
        `,[threadId]);
    const threadRow = threadRes.rows[0] as {author_id:number} | undefined;
    if(!threadRow) return;

    const authorId = threadRow.author_id;
    if(authorId === actorUserId) return;

    const insertRes = await query(
      `
        INSERT INTO notifications(user_id,actor_user_id,type,thread_id)
        VALUES ($1,$2,$3,$4)
        RETURNING id
        `,
      [authorId, actorUserId, "REPLY_ON_THREAD",threadId],
    );

    const notiRows = insertRes.rows[0] as {id:number};

    if(!notiRows) return;

    const fullRes = await query(`
        SELECT
            n.id,
            u.display_name AS actor_display_name,
            u.handle AS actor_handle,
            n.type,
            n.thread_id,
            n.created_at,
            n.read_at,
            t.title AS thread_title
        FROM notifications AS n
        JOIN users AS u ON n.actor_user_id = u.id
        JOIN threads AS t ON n.thread_id = t.id
        WHERE n.id = $1
        LIMIT 1
        `,[notiRows.id]);
    
    const fullRow = fullRes.rows[0] as NotificationRow | undefined;
    if(!fullRow) return ;
    const payload = mapNotificationRow(fullRow);

    //emit notification

}


export async function createLikeThreadNotification(params:{
    threadId:number;
    actorUserId:number;
}){
    const {threadId,actorUserId} = params;

    const threadRes = await query(`
        SELECT author_id
        FROM threads
        WHERE id = $1
        LIMIT 1
        `,[threadId]);
    const threadRow = threadRes.rows[0] as {author_id:number} | undefined;
    if(!threadRow) return;

    const authorId = threadRow.author_id;
    if(authorId === actorUserId) return;

    const insertRes = await query(
      `
        INSERT INTO notifications(user_id,actor_user_id,type,thread_id)
        VALUES ($1,$2,$3,$4)
        RETURNING id
        `,
      [authorId, actorUserId, "LIKE_ON_THREAD",threadId],
    );

    const notiRows = insertRes.rows[0] as {id:number};

    if(!notiRows) return;

    const fullRes = await query(`
        SELECT
            n.id,
            u.display_name AS actor_display_name,
            u.handle AS actor_handle,
            n.type,
            n.thread_id,
            n.created_at,
            n.read_at,
            t.title AS thread_title
        FROM notifications AS n
        JOIN users AS u ON n.actor_user_id = u.id
        JOIN threads AS t ON n.thread_id = t.id
        WHERE n.id = $1
        LIMIT 1
        `,[notiRows.id]);
    
    const fullRow = fullRes.rows[0] as NotificationRow | undefined;
    if(!fullRow) return ;
    const payload = mapNotificationRow(fullRow);

    //emit notification

}


export async function listNotificationsForUser(params:{
    userId:number;
    unreadOnly:boolean;
}){
    const {userId,unreadOnly} = params;

    const notiRes = await query(`
        SELECT
            n.id,
            u.display_name AS actor_display_name,
            u.handle AS actor_handle,
            n.type,
            n.thread_id,
            n.created_at,
            n.read_at,
            t.title AS thread_title
        FROM notifications AS n
        JOIN users AS u ON n.actor_user_id = u.id
        JOIN threads AS t ON n.thread_id = t.id
        WHERE n.user_id = $1 ${unreadOnly? ' AND read_at IS NULL':''}
        ORDER BY n.created_at DESC
        `,[userId]);
    const notiRows = notiRes.rows[0];
    if(!notiRows) return;

    return notiRes.rows.map((noti)=> mapNotificationRow(noti as NotificationRow))
}

export async function markNotificationRead(params:{
    notificationId:number;
}){
    const {notificationId} = params;

    await query(`
        UPDATE notifications
        SET read_at = COALESCE(read_at,NOW())
        WHERE id = $1
        `,[notificationId]);
}


export async function markAllNotificationsRead(params:{
    userId:number;
}){
    const {userId} = params;
    await query(
      `
        UPDATE notifications
        SET read_at = COALESCE(read_at,NOW())
        WHERE user_id = $1
        `,
      [userId],
    );
}