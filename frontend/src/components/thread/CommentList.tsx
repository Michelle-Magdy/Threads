import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CommentItem from "./Comment";
import { UserProfileResponse } from "@/types/user";
import { Comment } from "@/types/threads";

function CommentsList({currentUser,comments,threadId}:{currentUser:UserProfileResponse |null;comments:Comment[] | null;threadId:number}) {
    return (
      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-primary" />
            Comments ({comments?.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {comments?.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No comments yet!
            </p>
          ) : (
            <div className="space-y-4">
              {comments?.map((comment) => {
                const isCommentAuthor =
                  !!comment.author?.handle &&
                  !!currentUser?.handle &&
                  comment.author?.handle === currentUser?.handle;
                return (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    isCommentAuthor={isCommentAuthor}
                    threadId={threadId}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
}

export default CommentsList;