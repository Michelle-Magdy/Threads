import { getAuth } from "@clerk/express";
import { Router } from "express";
import { BadRequest, UnAuthorizedError } from "../lib/errors.js";
import { getUserFromClerk } from "../modules/users/user.service.js";
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "../modules/notifications/notifications.service.js";

export const notificationsRouter = Router();

// get notifications?unreadOnly = true|false
notificationsRouter.get("/", async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("please sign in first");
    }
    const profile = await getUserFromClerk(userId);

    const isUnreadOnly = req.query.unreadOnly === "true";

    const notificaitons = await listNotificationsForUser({
      userId: profile.user.id,
      unreadOnly: isUnreadOnly,
    });

    res.json({ data: notificaitons });
  } catch (err) {
    next(err);
  }
});

// mark all notification as read

notificationsRouter.post("/read-all", async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("please sign in first");
    }
    const profile = await getUserFromClerk(userId);

    await markAllNotificationsRead({ userId: profile.user.id });

    res.status(200);
  } catch (err) {
    next(err);
  }
});

// mark single notification as read
notificationsRouter.post("/:id/read", async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new UnAuthorizedError("please sign in first");
    }
    

    const notId = Number(req.params.id);
    if(!Number.isInteger(notId)){
        throw new BadRequest("notification id must be integer");
    }
    await markNotificationRead({ notificationId:notId});

    res.status(200);
  } catch (err) {
    next(err);
  }
});