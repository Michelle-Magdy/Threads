import { Card, CardContent, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { MessageCircle } from "lucide-react";
import { apiPost, createBrowserApiClient } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";
import { Comment } from "@/types/threads";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

function AddComment({
  userAvatarUrl,
  threadId,
  setComments,
  setCommentsCount,
}: {
  userAvatarUrl: string | null;
  threadId: number | null;
  setComments: Dispatch<SetStateAction<Comment[] | null>>;
  setCommentsCount: Dispatch<SetStateAction<number>>;
}) {
  const { getToken } = useAuth();
  const apiClient = createBrowserApiClient(getToken);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!body.trim() || !threadId) return; 

    setIsSubmitting(true);
    try {
      const createdComment = await apiPost<{ body: string }, Comment>(
        apiClient,
        `/api/v1/threads/${threadId}/comments`,
        { body: body.trim() },
      );
      setComments((prev) => (prev ? [...prev, createdComment] : [createdComment]));
      setCommentsCount((prev)=>prev+1);
      setBody("");
      toast.success("comment added");
    } catch (err) {
      console.log(err);
      setCommentsCount((prev)=>Math.max(prev-1,0));
      toast.error("failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <Card className="border-border/70 bg-card/50 flex flex-row items-center gap-3 p-3">
      <CardHeader className="mr-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userAvatarUrl ?? undefined} alt="User avatar" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </CardHeader>

      <CardContent className=" flex-1 p-0">
        <form
          className="flex flex-row justify-center gap-2 items-center"
          onSubmit={handleSubmit}
        >
          <Textarea
            rows={1}
            placeholder="Write a comment..."
            className="min-h-0 resize-none focus-visible:ring-0 flex-1 min-w-0 break-all overflow-hidden"
            onChange={(e) => setBody(e.target.value)}
            value={body}
            disabled={isSubmitting}
          />
          <Button
            size="sm"
            className="cursor-pointer shrink-0"
            type="submit"
            disabled={!body.trim() || isSubmitting || !threadId}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {isSubmitting && "..."} Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default AddComment;
