"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useNotification } from "@/hooks/useNotification";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Notification } from "@/types/notification";
import { useAuth } from "@clerk/nextjs";
import { CheckCheck, Inbox, MessageCircle, ThumbsUp } from "lucide-react";
import { Actor } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function formatText(n: Notification) {
  const actor =
    n.actor.handle !== null && n.actor.handle !== ""
      ? `@${n.actor.handle}`
      : (n.actor?.displayName ?? "Someone");

  if (n.type === "REPLY_ON_THREAD") {
    return `${actor} commented on your thread`;
  }
  if (n.type === "LIKE_ON_THREAD") {
    return `${actor} loved your thread`;
  }

  return `${actor} interacted your thread`;
}

function NotificationsPage() {
  const { getToken } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);
  const router = useRouter();
  const { decrementUnread, unreadCount } = useNotification();

  const [notifications, setNotifications] = useState<Notification[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const data = await apiGet<Notification[]>(
          apiClient,
          `/api/v1/notifications?unreadOnly=false`,
        );
        if (!isMounted) return;
        console.log("data", data);
        setNotifications(data ?? []);
      } catch (err) {
        if (!isMounted) return;
        console.log(err);
        toast.error("cannot load notifications");
      } finally {
        setIsLoading(false);
      }
    }
    load();

    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  async function openNoti(n: Notification) {
    try {
      if (!n.readAt) {
        await apiClient.post(`/api/v1/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev?.map((noti) =>
            noti.id === n.id
              ? { ...n, readAt: new Date().toISOString() }
              : noti,
          ),
        );
        decrementUnread();
      }

      router.push(`/threads/${n.threadId}`);
    } catch (err) {
      console.log(err);
      toast.error("cannot open this thread");
    }
  }

  async function readAll() {
    try {
      await apiClient.post(`/api/v1/notifications/read-all`);
      setNotifications((prev) =>
        prev?.map((noti) =>
          !noti.readAt ? { ...noti, readAt: new Date().toISOString() } : noti,
        ),
      );
      decrementUnread(unreadCount);
    } catch (err) {
      console.log(err);
      toast.error("cannot open this thread");
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8 px-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
          <Inbox className="h-7 w-7 text-primary" />
          Notifications ({unreadCount} new)
        </h1>
        <Button onClick={() => readAll()} disabled={unreadCount === 0}>
          <CheckCheck className="w-4 h-4" />
          read all
        </Button>
      </div>
      <Card className="border-border/70 bg-card  min-w-xl md:min-w-3xl">
        {isLoading && (
          <CardContent className="py-10 flex items-center justify-center">
            <Spinner className="text-primary h-7 w-7" />
          </CardContent>
        )}
        {!isLoading && notifications?.length === 0 && (
          <CardContent className="py-10 flex items-center justify-center">
            <p className="text-muted-foreground">No notifications</p>
          </CardContent>
        )}
        {!isLoading && notifications && notifications.length > 0 && (
          <CardContent className="divide-y divide-border">
            {notifications.map((n) => {
              const text = formatText(n);
              const icon =
                n.type === "REPLY_ON_THREAD" ? (
                  <MessageCircle className="w-4 h-4 text-chart-3" />
                ) : (
                  <ThumbsUp className="w-4 h-4 text-chart-1" />
                );
              const isUnread = !n.readAt;

              return (
                <button
                  key={n.id}
                  onClick={() => openNoti(n)}
                  type="button"
                  className={`flex w-full items-center gap-4 px-3 py-4 text-left transition-colors duration-200 ${isUnread ? "bg-primary/5 hover:bg-primary/30" : "hover:bg-primary/10"}`}
                >
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-background/60">
                    {icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md: justify-between">
                      <p
                        className={`text-sm ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                      >
                        {text}
                      </p>

                      <span
                        className={`shrink-0 text-sm ${isUnread ? "text-chart-1 font-medium" : "text-muted-foreground"}`}
                      >
                        {new Date(n.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-lg text-foreground ">
                      {n.threadTitle}
                    </p>
                    {isUnread && (
                      <div className="mt-2 flex items-center  gap-2">
                        <Badge
                          className="border-primary border-2 bg-backgorund text-[12px] 
                                "
                        >
                          New
                        </Badge>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default NotificationsPage;
