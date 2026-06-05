'use client';
import { UserContext } from "@/store/UserContext";
import { useContext } from "react";

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context; // Now TS guarantees user, setUser, and loading are defined!
};
