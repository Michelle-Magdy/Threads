"use client";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { UserProfileResponse } from "@/types/user";
import { useAuth } from "@clerk/nextjs";
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";

// 2. Define the interface for the Context's value
interface UserContextType {
  user: UserProfileResponse | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfileResponse | null>>;
  loading: boolean;
}

// 3. Create the Context with the explicit type (or null)
export const UserContext = createContext<UserContextType | null>(null);

// 4. Define props for the Provider component
interface UserProviderProps {
  children: ReactNode;
}

// 5. The Provider Component
export const UserProvider = ({ children }: UserProviderProps) => {
  // Explicitly type the state to hold UserData or null
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);
  const { getToken, isLoaded, userId } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  useEffect(() => {
    const controller = new AbortController();

    if (!isLoaded || !userId) {
      return () => {
        controller.abort();
      };
    }

    const fetchUserData = async () => {
      try {
        setIsFetchingUser(true);
        const data = await apiGet<UserProfileResponse>(apiClient, "/api/v1/me");
        setUser(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch user", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingUser(false);
        }
      }
    };

    fetchUserData();
    return () => {
      controller.abort();
    };
  }, [apiClient, isLoaded, userId]);

  const loading = !isLoaded || (Boolean(userId) && isFetchingUser);
  const contextUser = userId ? user : null;

  return (
    <UserContext value={{ user: contextUser, setUser, loading }}>
      {children}
    </UserContext>
  );
};
