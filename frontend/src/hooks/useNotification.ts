import { NotificationContext } from "@/store/NotificationContext";
import { useContext } from "react";

export function useNotification(){
    const ctx = useContext(NotificationContext);
    if(!ctx){
        throw new Error("context error");
    }
    return ctx;
}