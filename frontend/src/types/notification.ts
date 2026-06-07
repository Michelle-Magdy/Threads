export type NotificationType =
  | "REPLY_ON_THREAD"
  | "LIKE_ON_THREAD"
  | "LIKE_ON_COMMENT"
  | "REPLY_ON_COMMENT";

export type Notification = {
  id: number;
  type: NotificationType | string;
  threadId: number;
  createdAt: string;
  readAt: string | null;
  actor: {
    displayName: string | null;
    handle: string | null;
  };
  threadTitle: string | null;
};