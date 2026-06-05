"use client";
import AddComment from "@/components/thread/AddComment";
import CommentItem from "@/components/thread/Comment";
import CommentsList from "@/components/thread/CommentList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiGet, apiPost, createBrowserApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Comment, Thread, ThreadDetailResponse } from "@/types/threads";
import { UserProfileResponse } from "@/types/user";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function ThreadDetails() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { getToken, userId } = useAuth();

  const [thread, setThread] = useState<ThreadDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfileResponse | null>(
    null,
  );
  const [comments, setComments] = useState<Comment[] | null>([]);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentDeleted, setCommentDeleted] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  const apiClient = useMemo(() => {
    return createBrowserApiClient(getToken);
  }, [getToken]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadThread() {
      try {
        setIsLoading(true);
        const fetchedThread = await apiGet<Thread>(
          apiClient,
          `/api/v1/threads/${id}`,
          {
            signal: controller.signal,
          },
        );
        setThread(fetchedThread);
        setLikesCount(fetchedThread.likesCount);
        setCommentsCount(fetchedThread.commentsCount);
        setIsLiked(fetchedThread.isLiked);

        if (userId) {
          const fetchedUser = await apiGet<UserProfileResponse>(
            apiClient,
            "/api/v1/me",
          );
          setCurrentUser(fetchedUser);
        }
        console.log(fetchedThread);

        const fetchedComments = await apiGet<Comment[]>(
          apiClient,
          `/api/v1/threads/${fetchedThread.id}/comments`,
        );
        setComments(fetchedComments);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        toast.error("Failed to load thread");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }
    loadThread();
  }, [apiClient, id, userId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10">
        <p className="text-muted-foreground">Thread is Not Found</p>
      </div>
    );
  }

  async function toggleLikeThread() {
    if (!thread) return;

    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    try {
      setIsTogglingLike(true);
      setIsLiked((prev) => !prev);
      setLikesCount((prev) =>
        previousIsLiked ? Math.max(prev - 1, 0) : prev + 1,
      );

      await apiPost<null, null>(apiClient, `/api/v1/threads/${thread.id}/like`);
    } catch (err) {
      console.log(err);
      toast.error("cannot like this post");
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
    } finally {
      setIsTogglingLike(false);
    }
  }
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <Button
        variant={"ghost"}
        onClick={() => router.push("/")}
        className="w-fit rounded-full border border-primary/70 bg-card/70 text-xs font-medium text-muted-foreground cursor-pointer"
      >
        <ArrowLeft className="mr-2 w-4 h-4 text-primary" />
        Back
      </Button>
      <Card className="border-border/70 bg-card">
        <div className="flex flex-row items-start justify-start ">
          <div className="ml-5">
            <Image
              src={thread.author.avatarUrl || ""}
              alt={thread.author.displayName || ""}
              width={40}
              height={40}
              className="rounded-full h-10 w-10"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 flex-row items-center justify-start ">
                  <CardTitle className="text-lg text-foreground ">
                    {thread.author.displayName || "Your display name"}
                  </CardTitle>

                  <div className="mt-2 flex items-center">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        thread.author.handle
                          ? "bg-chart-1/10 text-chart-1"
                          : "bg-accent text-accent-foreground",
                      )}
                    >
                      {thread.author.handle
                        ? `@${thread.author.handle}`
                        : "@handle"}
                    </span>
                  </div>
                  <Badge
                    className="border-border/70 bg-secondary/70 text-sm mt-2"
                    variant={"outline"}
                  >
                    {thread.category.name}
                  </Badge>
                </div>
                <span className="text-muted-foreground">
                  {new Date(thread?.createAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardHeader>
            <CardContent className=" relative flex flex-col flex-1 gap-2">
              <h1 className="text-3xl font-bold ">{thread.title}</h1>

              <div className="text-wrap text-lg text-foreground">
                {thread.body}
              </div>
              <div className="relative h-96 w-full">
                <Image
                  src={"https://placehold.co/600x400"}
                  fill
                  className="object-cover rounded-md"
                  unoptimized
                  alt=""
                />
              </div>

              <div className="flex flex-row items-center justify-start gap-2 mt-3">
                {userId && (
                  <>
                    <Button
                      size={"sm"}
                      variant={isLiked ? "default" : "outline"}
                      className="cursor-pointer"
                      disabled={isTogglingLike}
                      onClick={toggleLikeThread}
                    >
                      <Heart />
                      {isTogglingLike ? "..." : likesCount > 0 ? likesCount : 0}
                    </Button>
                    <Button
                      size={"sm"}
                      variant={"outline"}
                      className="cursor-pointer"
                      disabled={isPostingComment}
                    >
                      <MessageCircle />
                      {commentsCount > 0 ? commentsCount : 0}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </div>
        </div>
      </Card>

      <AddComment
        userAvatarUrl={thread?.author?.avatarUrl}
        threadId={thread?.id}
        setComments={setComments}
        setCommentsCount={setCommentsCount}
      />
      {/*comments*/}
      <CommentsList currentUser={currentUser} comments={comments} threadId={thread.id} />

    </div>
  );
}

export default ThreadDetails;
