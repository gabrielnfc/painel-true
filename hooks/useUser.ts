import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email?: string;
}

export const useUser = () => {
  const { userId, getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      if (userId) {
        setUser({
          id: userId,
        });
      }
      setIsLoading(false);
    };

    initUser();
  }, [userId]);

  return {
    user,
    isLoading,
  };
}; 