import { useAuth } from "@clerk/nextjs";
import { apiDelete, apiPost, createBrowserApiClient } from "@/lib/api-client";
import { Comment } from "@/types/threads";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";
import AddReply from "./AddReply";
import { useUser } from "@/hooks/useUser";
import { Button } from "../ui/button";
import { Heart, MessageCircle, Trash } from "lucide-react";

function CommentItem({
  comment,
  isCommentAuthor,
  threadId,
  depth = 0,
}: {
  comment: Comment;
  isCommentAuthor: boolean;
  threadId: number;
  depth?: number;
}) {
  const { getToken } = useAuth();
  const { user, loading } = useUser();
  const apiClient = createBrowserApiClient(getToken);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [commentsCount, setCommentsCount] = useState(
    comment?.replies?.length || 0,
  );
  const [likesCount, setLikesCount] = useState(comment?.likesCount || 0);
  const [isLiked, setIsLiked] = useState(comment?.isLiked || false);
  const [isDeleteing, setIsDeleting] = useState(false);
  if (loading) return <>...loading</>;

  async function toggleLikeButton() {
    const prevLikesCount = likesCount;
    const prevIsLiked = isLiked;
    try {
      setIsTogglingLike(true);
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => (prevIsLiked ? Math.max(prev - 1, 0) : prev + 1));
      await apiPost<null, null>(
        apiClient,
        `/api/v1/threads/comments/${comment.id}/like`,
      );
    } catch (err) {
      console.log(err);
      toast.error("cannot like this comment right now");
      setIsLiked(prevIsLiked);
      setLikesCount(prevLikesCount);
    } finally {
      setIsTogglingLike(false);
    }
  }

  async function handleReplySubmit(parentId: number, body: string) {
    setIsPostingComment(true);
    try {
      await apiPost<{ parentId: number; body: string }, null>(
        apiClient,
        `/api/v1/threads/${threadId}/comments`,
        { parentId, body },
      );
      setCommentsCount((prev) => prev + 1);
      setShowReplyInput(false);
      toast.success("Reply posted");
    } catch (err) {
      console.log(err);
      toast.error("Failed to post reply");
    } finally {
      setIsPostingComment(false);
    }
  }

  async function handleDeleteComment() {
    try {
      setIsDeleting(true);
      await apiDelete(apiClient, `/api/v1/threads/comments/${comment.id}`);
      toast.success('comment is deleted')
    } catch (err) {
      console.log(err);
      toast.error("cannot delete this comment");
    } finally {
      setIsDeleting(false);

    }
  }

  const hasReplies = comment.replies && comment.replies.length > 0;
  const shouldIndent = depth > 0 && depth <= 2;

  return (
    <div className={cn("flex", depth > 0 && "mt-2")}>
      {/* Vertical thread line for nested comments (cap indentation at depth 3) */}
      {shouldIndent && (
        <div className="mr-3 flex flex-col items-center">
          <div className="w-px h-6 bg-border" />
          <div className="w-px flex-1 bg-border" />
        </div>
      )}

      <div className={cn("flex-1", depth === 0 && "w-full")}>
        {/* Main comment row */}
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            <Image
              src={comment.author.avatarUrl || ""}
              alt={comment.author.displayName || ""}
              width={40}
              height={40}
              className="rounded-full h-10 w-10 object-cover"
              unoptimized
            />
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Comment bubble */}
            <div className="bg-muted/50 rounded-2xl px-4 py-2.5 inline-block max-w-full">
              {/* Header: Name + Handle + Timestamp */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 justify-center">
                  <span className="font-semibold text-sm text-foreground">
                    {isCommentAuthor
                      ? "(You)"
                      : comment.author.displayName || "Your display name"}
                  </span>
                  {comment.author.handle && (
                    <span className="text-xs text-muted-foreground">
                      @{comment.author.handle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment?.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <button onClick={handleDeleteComment}>
                    <Trash className="h-4 w-4 font-semibold text-destructive transition-transform duration-300 hover:font-bold hover:scale-110 cursor-pointer" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-foreground mt-1 whitespace-pre-wrap wrap-break-word">
                {comment.body}
              </p>
            </div>
            {/* Actions row */}
            <div className="flex flex-row items-center justify-start gap-2 mt-1">
              {user && (
                <>
                  <Button
                    size={"sm"}
                    variant={isLiked ? "default" : "outline"}
                    className="cursor-pointer"
                    disabled={isTogglingLike}
                    onClick={toggleLikeButton}
                  >
                    <Heart />
                    {isTogglingLike ? "..." : likesCount > 0 ? likesCount : 0}
                  </Button>
                  <Button
                    size={"sm"}
                    variant={"outline"}
                    className="cursor-pointer"
                    disabled={isPostingComment}
                    onClick={() => setShowReplyInput((prev) => !prev)}
                  >
                    <MessageCircle />
                    {commentsCount > 0 ? commentsCount : 0}
                  </Button>
                </>
              )}
            </div>
            {showReplyInput && (
              <div className="mt-3">
                <AddReply
                  onSubmit={handleReplySubmit}
                  parentId={comment.id}
                  isLoading={isPostingComment}
                  placeholder={`Reply to ${comment.author.displayName}...`}
                  replyToName={comment.author.displayName}
                  onCancel={() => setShowReplyInput(false)}
                  autoFocus
                />
              </div>
            )}
            {/* Nested replies */}
            {hasReplies && depth < 2 && (
              <div className="mt-2">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isCommentAuthor={reply.author.handle === user?.handle}
                    threadId={threadId}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        {hasReplies && depth >= 2 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isCommentAuthor={reply.author.handle === user?.handle}
                threadId={threadId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentItem;
