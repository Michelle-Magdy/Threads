import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Smile, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarImage } from "../ui/avatar";

interface AddCommentProps {
  onSubmit: (parentId:number,body: string) => void | Promise<void>;
  parentId:number;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  replyToName?: string;
  onCancel?: () => void;
  className?: string;
}

export default function AddReply({
  onSubmit,
  parentId,
  isLoading = false,
  placeholder = "Write a comment...",
  autoFocus = false,
  replyToName,
  onCancel,
  className,
}: AddCommentProps) {
  const [body, setBody] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const {user,loading} = useUser();
  if(loading) return<>...loading</>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isLoading) return;

    await onSubmit(parentId,body.trim());
    setBody("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex gap-3 items-start", className)}
    >
      {/* Avatar placeholder - pass currentUserAvatar as prop if needed */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">

       <Avatar>
        <AvatarImage src={user?.avatarURL||""} alt={user?.handle|| ""} />
       </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "relative rounded-2xl border transition-all",
            isFocused
              ? "border-primary/50 bg-background ring-1 ring-primary/20"
              : "border-input bg-muted/50",
          )}
        >
          {/* Reply indicator */}
          {replyToName && (
            <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">
                Replying to{" "}
                <span className="font-semibold text-foreground">
                  {replyToName}
                </span>
              </span>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-0.5 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={1}
            className={cn(
              "min-h-9 max-h-30 resize-none border-0 bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "px-3 py-2 text-sm",
              replyToName ? "pt-2" : "pt-2.5",
            )}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <div className="flex items-center gap-1">
              
              <button
                type="button"
                className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                title="Add image"
              >
                {/* <Image className="w-4 h-4" alt=""/> */}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Character count / hint */}
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Press Enter to send
              </span>

              <Button
                type="submit"
                size="sm"
                disabled={!body.trim() || isLoading}
                className="h-7 px-3 rounded-full text-xs"
              >
                <Send className="w-3 h-3 mr-1" />
                {isLoading ? "..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
