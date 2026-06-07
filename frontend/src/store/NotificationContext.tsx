"use client";

import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useMemo, useState } from "react";

type NotificationContextValue = {
  unreadCount: number;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  incrementUnread: (val?: number) => void;
  decrementUnread: (val?: number) => void;
};

export const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {

    const [unreadCount,setUnreadCount] = useState(0);

    const decrementUnread = useCallback((val:number = 1)=>{
        if(val <=0) return;
        setUnreadCount(prev => Math.max(0,prev - val));
    },[]);

    const incrementUnread = useCallback((val:number = 1)=>{
        if(val <=0) return;
        setUnreadCount(prev => prev + val);
    },[]);
    const value = useMemo(()=>({
        unreadCount,
        setUnreadCount,
        incrementUnread,
        decrementUnread
    }),[
        unreadCount,incrementUnread,decrementUnread
    ])


    return <NotificationContext value={value}>
        {children}
    </NotificationContext>
}
